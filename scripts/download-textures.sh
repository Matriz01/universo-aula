#!/usr/bin/env bash
# download-textures.sh — Descarga texturas de Solar System Scope (CC BY 4.0)
#
# Uso: bash scripts/download-textures.sh
#
# Requiere: curl
# Licencia texturas: CC BY 4.0 — https://www.solarsystemscope.com/textures/
# Atribución obligatoria en UI y CREDITS.md

set -euo pipefail

TEXTURE_BASE_URL="https://www.solarsystemscope.com/textures/download"
PUBLIC_DIR="$(dirname "$0")/../public/textures"

# ---------------------------------------------------------------------------
# Crear directorios destino
# ---------------------------------------------------------------------------
mkdir -p "$PUBLIC_DIR"/{sun,mercury,venus,earth,moon,mars,jupiter,saturn,saturn-rings,uranus,neptune,pluto}

echo "Descargando texturas Solar System Scope (CC BY 4.0)..."
echo "URL base: $TEXTURE_BASE_URL"
echo ""

# ---------------------------------------------------------------------------
# Función de descarga con fallback de nombres alternativos
# ---------------------------------------------------------------------------
download_texture() {
  local filename="$1"
  local dest_path="$2"
  local url="${TEXTURE_BASE_URL}/${filename}"

  if [ -f "$dest_path" ]; then
    echo "  [SKIP] $dest_path ya existe"
    return 0
  fi

  echo "  Descargando $filename -> $dest_path"
  if curl -fsSL --retry 3 --retry-delay 2 -o "$dest_path" "$url"; then
    echo "  [OK] $dest_path"
    return 0
  else
    echo "  [ERROR] No se pudo descargar $url"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Sol
# ---------------------------------------------------------------------------
download_texture "2k_sun.jpg" "$PUBLIC_DIR/sun/2k.jpg" || true

# ---------------------------------------------------------------------------
# Planetas interiores
# ---------------------------------------------------------------------------
download_texture "2k_mercury.jpg"           "$PUBLIC_DIR/mercury/2k.jpg"     || true
download_texture "2k_venus_atmosphere.jpg"  "$PUBLIC_DIR/venus/2k.jpg"       || \
  download_texture "2k_venus_surface.jpg"   "$PUBLIC_DIR/venus/2k.jpg"       || true
download_texture "2k_earth_daymap.jpg"      "$PUBLIC_DIR/earth/2k.jpg"       || \
  download_texture "2k_earth_day.jpg"       "$PUBLIC_DIR/earth/2k.jpg"       || true
download_texture "2k_moon.jpg"              "$PUBLIC_DIR/moon/2k.jpg"        || true
download_texture "2k_mars.jpg"              "$PUBLIC_DIR/mars/2k.jpg"        || true

# ---------------------------------------------------------------------------
# Planetas exteriores
# ---------------------------------------------------------------------------
download_texture "2k_jupiter.jpg"           "$PUBLIC_DIR/jupiter/2k.jpg"     || true
download_texture "2k_saturn.jpg"            "$PUBLIC_DIR/saturn/2k.jpg"      || true
download_texture "2k_saturn_ring_alpha.png" "$PUBLIC_DIR/saturn-rings/2k.png" || \
  download_texture "2k_saturn_ring.png"     "$PUBLIC_DIR/saturn-rings/2k.png" || true
download_texture "2k_uranus.jpg"            "$PUBLIC_DIR/uranus/2k.jpg"      || true
download_texture "2k_neptune.jpg"           "$PUBLIC_DIR/neptune/2k.jpg"     || true
download_texture "2k_pluto.jpg"             "$PUBLIC_DIR/pluto/2k.jpg"       || true

# ---------------------------------------------------------------------------
# Checksums SHA-256 para reproducibilidad
# ---------------------------------------------------------------------------
echo ""
echo "Checksums SHA-256:"
echo "==================="

if command -v sha256sum &>/dev/null; then
  find "$PUBLIC_DIR" -name "*.jpg" -o -name "*.png" 2>/dev/null | sort | xargs sha256sum 2>/dev/null || true
elif command -v shasum &>/dev/null; then
  find "$PUBLIC_DIR" -name "*.jpg" -o -name "*.png" 2>/dev/null | sort | xargs shasum -a 256 2>/dev/null || true
else
  echo "  sha256sum/shasum no disponible — instala coreutils para generar checksums"
fi

echo ""
echo "Descarga completada."
echo ""
echo "ATRIBUCIÓN OBLIGATORIA:"
echo "  Solar System Scope — https://www.solarsystemscope.com/textures/"
echo "  Licencia: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/"
echo "  Creado por inove.sk"
