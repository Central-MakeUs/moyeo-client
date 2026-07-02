# shared/api

HTTP clients, generated API clients, and transport-level DTOs live here.

Orval setup is intentionally handled in a follow-up issue. Generated files are expected to be placed under `src/shared/api/generated`.

Upper FSD layers may import from `shared/api`, but `shared/api` must not import from upper layers.
