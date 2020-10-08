import io from "socket.io-client"
import fetch from "cross-fetch"
import { EventEmitter } from "events"

const events = [
  "title",
  "icecast-down",
  "beat",
  "btn",
  "vdj-disconnected",
  "vdj-connected",

  "disconnect",
  "connect_error",
  "connect_timeout",
  "reconnect",
  "reconnect_attempt",
  "reconnecting",
  "reconnect_error",
  "reconnect_failed"
]

const socketEvents = [
  "connect",
  "disconnect",
  "error",
  "connect_error",
  "connect_timeout",
  "reconnect",
  "reconnect_attempt",
  "reconnecting",
  "reconnect_error",
  "reconnect_failed",
  "pong"
]

type beatData = {
  change: boolean
  pos: number
  bpm: number
  strength: number
}

type error = {
  [key: string]: any
}

class VDJ {
  private emitter = new EventEmitter()
  public readonly socket = io(`ws://${this.address}`) // TODO address?

  constructor(public ip: string, public port: number) {
    for (const event of events) {
      this.socket.on(event, (...args: any[]) => {
        this.emitter.emit(event, ...args)
      })
    }

    for (const event of socketEvents) {
      this.socket.on(event, (...args: any[]) => {
        this.emitter.emit("io_" + event, ...args)
      })
    }
  }

  public on(event: "title", listener: (title: string) => void): void
  public on(event: "icecast-down", listener: (reason: string) => void): void
  public on(event: "beat", listener: (beatData: beatData) => void): void
  public on(event: "btn", listener: (button: string) => void): void
  public on(event: "vdj-disconnected", listener: VoidFunction): void
  public on(event: "vdj-connected", listener: VoidFunction): void

  public on(event: "io_connected", listener: VoidFunction): void
  public on(event: "io_disconnect", listener: (reason: string) => void): void
  public on(event: "io_error", listener: (error: error) => void): void
  public on(event: "io_connect_error", listener: (error: error) => void): void
  public on(event: "io_connect_timeout", listener: (timeout: any) => void): void
  public on(event: "io_reconnect", listener: (attemptNumber: any) => void): void
  public on(event: "io_reconnect_attempt", listener: (attemptNumber: any) => void): void
  public on(event: "io_reconnecting", listener: (attemptNumber: any) => void): void
  public on(event: "io_reconnect_error", listener: (error: error) => void): void
  public on(event: "io_reconnect_failed", listener: VoidFunction): void
  public on(event: "io_pong", listener: (latency: number) => void): void

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

  public disconnect() {
    this.socket.close()
  }
}

export default VDJ