import { OS2LServer } from "os2l"

export default async (io: SocketIO.Server, port: number, doPublish: boolean) => {
  const os2lServer = new OS2LServer({ port, doPublish })
  
  os2lServer.on("error", console.error)
  
  os2lServer.on("beat", data => {
    delete data.evt
    io.emit("beat", data)
  })
  
  os2lServer.on("btn", btn => {
    io.emit("btn", btn)
  })
  
  os2lServer.on("closed", () => {
    io.emit("vdj-disconnected")
  })
  
  os2lServer.on("connection", () => {
    io.emit("vdj-connected")
  })
  
  await os2lServer.start()
}