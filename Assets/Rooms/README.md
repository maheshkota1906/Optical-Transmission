# Optical Transmission sample room assets

AQ and HA rooms are generated as procedural 3D sample environments. You can replace any room with your own GLB model by uploading it with the exact filename below.

## AQ site
- `AQ_optical_Room.glb` — Optical Transmission Room
- `AQ_odf_Room.glb` — ODF & Fiber Patching Room
- `AQ_nms_Room.glb` — Network Monitoring Room

## HA site
- `HA_server_Room.glb` — Server Room
- `HA_ups_Room.glb` — UPS & Battery Room
- `HA_monitoring_Room.glb` — Network Monitoring Room

The application checks for the matching file under `Assets/Rooms/` when you enter a room. If the GLB is present it loads that model; otherwise it shows the built-in sample room.

**Model guidance:** export as GLB with textures embedded, use metres as the scale, and keep the room floor near Y=0. Position the intended player spawn area near the centre of the room where possible.