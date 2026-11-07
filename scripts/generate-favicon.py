"""Render the YouKidZoo vector mascot at favicon and home-screen sizes."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / "public"
scale = 16
image = Image.new("RGBA", (64 * scale, 64 * scale))
draw = ImageDraw.Draw(image)

def box(bounds):
    return tuple(round(v * scale) for v in bounds)

def ellipse(bounds, color):
    draw.ellipse(box(bounds), fill=color)

draw.rounded_rectangle(box((0, 0, 64, 64)), radius=17 * scale, fill="#a8325c")
ellipse((8, 9, 28, 29), "#f8d879")
ellipse((36, 9, 56, 29), "#a8d7b7")
ellipse((13, 14, 23, 24), "#fff3df")
ellipse((41, 14, 51, 24), "#fff3df")
draw.rounded_rectangle(box((12, 17, 52, 54)), radius=18 * scale, fill="#fff3df")
ellipse((21.5, 30.5, 26.5, 35.5), "#293f37")
ellipse((37.5, 30.5, 42.5, 35.5), "#293f37")
ellipse((15, 36.5, 23, 41.5), "#f1afbd")
ellipse((41, 36.5, 49, 41.5), "#f1afbd")
draw.polygon([tuple(v * scale for v in point) for point in [(29,39),(32,37.5),(35,39),(32,42)]], fill="#293f37")
points = []
for i in range(41):
    t = i / 40
    points.append(((27 + 10 * t) * scale, ((1-t)**2 * 44 + 2*(1-t)*t*49 + t*t*44) * scale))
draw.line(points, fill="#293f37", width=round(2.5 * scale))
for x in (27, 37):
    ellipse((x-1.25, 42.75, x+1.25, 45.25), "#293f37")

for size, name in [(180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    image.resize((size, size), Image.Resampling.LANCZOS).save(root / name)
image.save(root / "favicon.ico", sizes=[(16,16), (32,32), (48,48)])
print("Generated browser and home-screen icons.")
