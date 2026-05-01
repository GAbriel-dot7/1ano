from PIL import Image, ImageDraw, ImageFilter, ImageFont


def rounded_rect(draw, xy, radius, fill):
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def vertical_gradient(size, top_color, bottom_color):
    width, height = size
    image = Image.new('RGBA', size)
    pixels = image.load()
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(top_color[0] * (1 - t) + bottom_color[0] * t)
        g = int(top_color[1] * (1 - t) + bottom_color[1] * t)
        b = int(top_color[2] * (1 - t) + bottom_color[2] * t)
        a = int(top_color[3] * (1 - t) + bottom_color[3] * t)
        for x in range(width):
            pixels[x, y] = (r, g, b, a)
    return image


def make_icon(size):
    img = vertical_gradient((size, size), (255, 247, 251, 255), (255, 228, 241, 255))
    draw = ImageDraw.Draw(img)

    # soft confetti background
    confetti = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(confetti)
    for i in range(22):
        x = int(size * (0.06 + (i * 0.041) % 0.88))
        y = int(size * (0.08 + (i * 0.071) % 0.84))
        color = (247, 191, 216, 90) if i % 2 == 0 else (205, 190, 251, 85)
        cdraw.line((x, y, x + int(size * 0.09), y + int(size * 0.03)), fill=color, width=max(1, size // 70))
    confetti = confetti.filter(ImageFilter.GaussianBlur(radius=max(1, size // 140)))
    img.alpha_composite(confetti)

    # ears and paws
    fur = (124, 90, 73, 255)
    paw = (217, 194, 181, 220)
    dark_paw = (183, 156, 140, 180)
    left_ear = [(int(size*0.31), int(size*0.25)), (int(size*0.23), int(size*0.39)), (int(size*0.36), int(size*0.40))]
    right_ear = [(int(size*0.69), int(size*0.25)), (int(size*0.77), int(size*0.39)), (int(size*0.64), int(size*0.40))]
    draw.line(left_ear + [left_ear[0]], fill=fur, width=max(6, size // 28))
    draw.line(right_ear + [right_ear[0]], fill=fur, width=max(6, size // 28))

    draw.ellipse((int(size*0.16), int(size*0.56), int(size*0.31), int(size*0.77)), fill=paw)
    draw.ellipse((int(size*0.69), int(size*0.56), int(size*0.84), int(size*0.77)), fill=paw)
    draw.ellipse((int(size*0.19), int(size*0.60), int(size*0.28), int(size*0.73)), fill=dark_paw)
    draw.ellipse((int(size*0.72), int(size*0.60), int(size*0.81), int(size*0.73)), fill=dark_paw)

    # face and arms
    stroke = max(4, size // 38)
    draw.arc((int(size*0.33), int(size*0.19), int(size*0.67), int(size*0.43)), 200, -20, fill=fur, width=stroke)
    draw.line((int(size*0.32), int(size*0.36), int(size*0.27), int(size*0.51)), fill=fur, width=stroke)
    draw.line((int(size*0.68), int(size*0.36), int(size*0.73), int(size*0.51)), fill=fur, width=stroke)
    draw.arc((int(size*0.31), int(size*0.29), int(size*0.69), int(size*0.52)), 200, -20, fill=fur, width=max(3, size // 50))
    draw.arc((int(size*0.41), int(size*0.39), int(size*0.50), int(size*0.45)), 220, 320, fill=fur, width=max(2, size // 70))
    draw.arc((int(size*0.50), int(size*0.39), int(size*0.59), int(size*0.45)), 220, 320, fill=fur, width=max(2, size // 70))
    draw.arc((int(size*0.47), int(size*0.44), int(size*0.53), int(size*0.52)), 200, 340, fill=fur, width=max(2, size // 90))

    # heart
    heart = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(heart)
    heart_fill = (194, 0, 255, 255)
    heart_outline = (208, 0, 255, 255)
    cx = size // 2
    top_y = int(size * 0.36)
    left_x = int(size * 0.24)
    right_x = int(size * 0.76)
    bottom_y = int(size * 0.79)
    hdraw.polygon([
        (cx, bottom_y),
        (left_x, int(size * 0.53)),
        (left_x, top_y),
        (cx, int(size * 0.48)),
        (right_x, top_y),
        (right_x, int(size * 0.53)),
    ], fill=heart_fill)
    hdraw.ellipse((int(size*0.24), int(size*0.33), int(size*0.49), int(size*0.58)), fill=heart_fill)
    hdraw.ellipse((int(size*0.51), int(size*0.33), int(size*0.76), int(size*0.58)), fill=heart_fill)
    hdraw.polygon([(int(size*0.27), int(size*0.50)), (cx, bottom_y), (int(size*0.73), int(size*0.50))], fill=heart_fill)
    # outline
    hdraw.line([(cx, bottom_y), (left_x, int(size * 0.53)), (left_x, top_y), (cx, int(size * 0.48)), (right_x, top_y), (right_x, int(size * 0.53)), (cx, bottom_y)], fill=heart_outline, width=max(6, size // 42))
    hdraw.arc((int(size*0.24), int(size*0.33), int(size*0.49), int(size*0.58)), 180, 360, fill=heart_outline, width=max(6, size // 42))
    hdraw.arc((int(size*0.51), int(size*0.33), int(size*0.76), int(size*0.58)), 180, 360, fill=heart_outline, width=max(6, size // 42))
    hdraw.line([(int(size*0.27), int(size*0.50)), (cx, bottom_y), (int(size*0.73), int(size*0.50))], fill=heart_outline, width=max(6, size // 42))

    # highlight and text
    highlight = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    hd.ellipse((int(size*0.31), int(size*0.40), int(size*0.45), int(size*0.56)), fill=(255, 255, 255, 55))
    hd.ellipse((int(size*0.56), int(size*0.36), int(size*0.70), int(size*0.54)), fill=(255, 255, 255, 38))
    highlight = highlight.filter(ImageFilter.GaussianBlur(radius=max(1, size // 90)))
    heart.alpha_composite(highlight)

    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', max(18, size // 5))
    except Exception:
        font = ImageFont.load_default()
    text = 'AMOR'
    bbox = ImageDraw.Draw(heart).textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = int((size - tw) / 2)
    ty = int(size * 0.50 - th / 2)
    ImageDraw.Draw(heart).text((tx, ty), text, font=font, fill=(255, 96, 70, 255), stroke_width=max(1, size // 80), stroke_fill=(255, 96, 70, 255))

    img.alpha_composite(heart)
    return img


for size, filename in [(180, 'icon-180.png'), (192, 'icon-192.png'), (512, 'icon-512.png')]:
    icon = make_icon(size)
    icon.save(filename)
    print(f'created {filename}')
