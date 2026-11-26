# Optical Transmission sample room assets

The AQ and HA sample rooms are currently generated procedurally by the WebGL application.

To replace a sample room with your own GLB, upload your model using one of these exact paths:

- `AQ_Room.glb` — AQ Optical Transmission room
- `HA_Room.glb` — HA / Server room

Place both files in this `Assets/Rooms/` folder. The application checks for the matching GLB when a site is selected. If it exists, it loads that model; if it does not exist, the built-in sample room is shown.

**Model guidance:** export as GLB with textures embedded, place the room floor near Y=0, and keep the walkable interior centred around the origin where possible. Use sensible real-world scale (metres).