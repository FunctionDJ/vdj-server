import io from "socket.io-client"
import fetch from "cross-fetch"
import { EventEmitter } from "events"

const events = [
  "title",
  "icecast-down",
  "beat",
  "btn",
  "vdj-disconnected",
  "vdj-connected"
]

class VDJ {
  private emitter = new EventEmitter()
  private socket = io() // TODO address?

  constructor(public ip: string, public port: number) {
    for (const event of events) {
      this.socket.on(event, (...args: any[]) => {
        this.emitter.emit(event, ...args)
      })
    }
  }

  public on(event: "title", listener: (title: string) => void): void
  public on(event: "icecast-down", listener: (reason: string) => void): void
  public on(event: "beat", listener: VoidFunction): void
  public on(event: "btn", listener: (button: string) => void): void
  public on(event: "vdj-disconnected", listener: VoidFunction): void
  public on(event: "vdj-connected", listener: VoidFunction): void

  public on(event: string, listener: (...args: any[]) => void): void {
    this.emitter.on(event, listener)
  }

  private get address() {
    return this.ip + ":" + this.port
  }

  async getSong(name: string): Promise<string> { // TODO type the response
    const response = await fetch(this.address + "/song/" + name)
    return response.json()
  }

  async getHistory(): Promise<any> { // TODO ,,
    const response = await fetch(this.address + "/history")
    return response.json()
  }
}

export default VDJ