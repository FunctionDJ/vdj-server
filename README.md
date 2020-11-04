# Virtual DJ "Server"

This tool takes various resources from the filesystem, a wrapped Icecast server, and the OS2L protocol and provides them via WebSocket (socket.io) and REST.

REST Endpoints:
- GET /song/[songName] - searches all available VDJ databases and returns the results (as typed JSON, fuzzy search)
- GET /history - gets the full song history (as typed JSON) of the current date
Soon: POST /play/[songName] - searches the DBs (fuzzy) and attempts to load the best match into VDJ

Socket.io events:
- "title" - currently playing title
- "beat" - OS2L beat event
- [all other OS2L events, like "btn", and some extra events like "vdj-disconnected" and "icecast-down"]
