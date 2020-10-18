import { spawn } from "child_process"
import fetch from "node-fetch"

export default async ({
  io,
  checkInterval,
  onFirstData,
  onEmit,
  onData,
  onType
}: {
  io: SocketIO.Server,
  checkInterval: number,
  onFirstData: VoidFunction,
  onEmit: (title: string) => void,
  onData: (data: string) => void,
  onType: (type: string) => void
}) => {
  const iceCast = spawn("icecast.bat", { cwd: "./icecast" })

  iceCast.stdout.once("data", () => {
    onFirstData()

    let lastTitle = ""
  
    const check = async () => {
      const response = await fetch("http://localhost:8000/status-json.xsl")
  
      try {
        const { icestats } = await response.json()
    
        if (icestats.source && icestats.source.title !== lastTitle) {
          lastTitle = icestats.source.title
          onEmit(lastTitle)
          io.emit("title", lastTitle)
        }
      } catch (_error) {} // just ignore errors caused by invalid JSON body
  
      setTimeout(check, checkInterval)
    }
  
    check()

    // send current track on connect
    io.on("connect", () => {
      if (lastTitle !== "") {
        io.emit("title", lastTitle)
      }
    })
  })
  
  iceCast.stdout.on("data", data => onData(String(data)))
  
  for (const type of ["error", "exit", "disconnect", "close"]) {
    iceCast.on(type, () => onType(type))
  }
}