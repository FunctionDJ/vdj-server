import SocketIO from "socket.io"
import express from "express"
import http from "http"
import { promises as fs } from "fs"
import path from "path"
import xml2js from "xml2js"
import VirtualDJ from "../../DJ-Softwares/VirtualDJ"
import Database from "../../DJ-Softwares/VirtualDJ/Database"
import initOS2L from "./initOS2L"
import initIceCast from "./initIceCast"

const historyFolder = "C:/Users/roman/Documents/VirtualDJ/History"
const historyDataPrefix = "#EXTVDJ:"

const expressApp = express()
const httpServer = http.createServer(expressApp)
httpServer.listen(3000)

const io = SocketIO(httpServer)

type HistoryEntry = {
  filePath: string
  name: string
  time?: string
  lastPlayed?: Date
  artist?: string
  title?: string
  remix?: string
  fileSize?: string
}

let vdjMasterDB: Database|null = null

expressApp.get("/song/:name", async (req, res) => {
  if (vdjMasterDB === null) {
    await VirtualDJ.readAllDefaultDatabases()
    vdjMasterDB = VirtualDJ.getMasterbase()
  }

  res.send(
    vdjMasterDB.getSongsFuzzy(req.params.name, 3)
      .map(({ item }) => ({
        title: item.tags.title,
        author: item.tags.author,
        length: item.infos.songLength,
        fileSize: item.fileSize,
        bitrate: item.infos.bitrate,
        bpm: item.scan?.bpm,
        key: item.scan?.key,
        album: item.tags.album,
        genre: item.tags.genre,
        year: item.tags.year
      }))
  )
})

expressApp.get("/history", async (_req, res) => { // TODO cache this bitch
  const folderContents = await fs.readdir(historyFolder, {
    withFileTypes: true
  })

  const newestFile = folderContents
  .filter(i => i.isFile() && i.name.match(/\d{4}-\d{2}-\d{2}\.m3u/)) // only propert history files
  .sort((a, b) => a.name > b.name ? -1 : 0) // sort by newest date first
  [0]

  if (!newestFile) {
    res.send(null)
  }

  const playlistContents = await fs.readFile(path.join(historyFolder, newestFile.name), {
    encoding: "utf-8"
  })

  const jsonResponse = await playlistContents
    .split("\n")
    .reduce(async (prevPromise, line, lineNumber, lines) => {
      const prev = await prevPromise

      if (line.trim() === "") {
        return prev
      }

      if (line.startsWith("#")) {
        return prev
      }

      const result: HistoryEntry = { // TODO slap this history shit into the VirtualDJ module
        filePath: line,
        name: path.parse(line).name,
        time: undefined,
        lastPlayed: undefined,
        artist: undefined,
        title: undefined,
        remix: undefined,
        fileSize: undefined
      }

      const prevLine = lines[lineNumber - 1]

      if (prevLine && prevLine.startsWith(historyDataPrefix)) {
        const xmlString = "<root>" + prevLine.replace(/&/gm, "&amp;").slice(historyDataPrefix.length) + "</root>"
        const xml = await xml2js.parseStringPromise(xmlString, {
          explicitChildren: false,
          explicitArray: false,
          explicitRoot: false,
          doctype: ""
        })

        result.time = xml.time
        result.lastPlayed = xml.lastplaytime ? new Date(xml.lastplaytime * 1000) : undefined
        result.fileSize = xml.filesize
        result.remix = xml.remix
        result.artist = xml.artist
        result.title = xml.title
      }

      return [...prev, result]
    }, Promise.resolve([] as HistoryEntry[]))

  res.send(jsonResponse)
})

initIceCast({
  io,
  checkInterval: 1000,
  onFirstData: () => console.log("IceCast should be running at http://127.0.0.1:8000/"),
  onEmit: title => console.log("emitting title", title),
  onData: data => console.log("IceCast:", data),
  onType: type => io.emit("icecast-down", type)
})

initOS2L(io, 5000, true).then(() =>
  console.log("os2l is now listening on port 5000")
)