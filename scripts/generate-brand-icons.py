"""Requiere Pillow. Genera iconos sin recortar ni deformar el logo oficial."""
from pathlib import Path
from PIL import Image, ImageOps

public = Path(__file__).resolve().parents[1] / "public"
source = Image.open(public / "motoapex-logo.png").convert("RGBA")
# Canvas cuadrado transparente; mantiene la imagen completa y sus proporciones.
square = Image.new("RGBA", (max(source.size), max(source.size)), (0, 0, 0, 0))
square.alpha_composite(source, ((square.width-source.width)//2, (square.height-source.height)//2))
square.save(public / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
ImageOps.contain(square, (180, 180), Image.Resampling.LANCZOS).save(public / "apple-touch-icon.png")
icon = Image.open(public / "favicon.ico")
assert icon.ico.sizes() == {(16, 16), (32, 32), (48, 48)}
assert Image.open(public / "apple-touch-icon.png").size == (180, 180)
print("favicon.ico: 16, 32, 48 px; apple-touch-icon.png: 180 x 180 px")
