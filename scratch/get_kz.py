import urllib.request
from PIL import Image
import io

url = "https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/textures/painting/kz.png"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = response.read()
    img = Image.open(io.BytesIO(data)).convert("RGBA")
    width, height = img.size
    print(f"Image size: {width}x{height}")
    
    # We want to find contiguous blocks of non-transparent pixels.
    # Since kz.png is laid out on a grid, let's just scan 16x16 blocks.
    # Actually, paintings have a 1-pixel frame sometimes. Let's just find the bounding boxes of non-transparent regions.
    
    pixels = img.load()
    visited = set()
    boxes = []
    
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 0 and (x, y) not in visited:
                # BFS to find the bounding box
                q = [(x, y)]
                visited.add((x, y))
                min_x, max_x = x, x
                min_y, max_y = y, y
                while q:
                    cx, cy = q.pop(0)
                    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1), (-1,-1), (1,1), (-1,1), (1,-1)]:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if (nx, ny) not in visited and pixels[nx, ny][3] > 0:
                                visited.add((nx, ny))
                                q.append((nx, ny))
                                min_x = min(min_x, nx)
                                max_x = max(max_x, nx)
                                min_y = min(min_y, ny)
                                max_y = max(max_y, ny)
                boxes.append((min_x, min_y, max_x - min_x + 1, max_y - min_y + 1))

    # filter out very small artifacts (e.g. 1x1)
    boxes = [b for b in boxes if b[2] > 10 and b[3] > 10]
    
    for b in sorted(boxes, key=lambda x: (x[1], x[0])):
        print(f"[{b[0]}, {b[1]}, {b[2]}, {b[3]}],")

except Exception as e:
    print("Error:", e)
