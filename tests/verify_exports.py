"""Validate exported pixel structure and fully decode every GIF frame (requires Pillow)."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent / 'test-results'
base = Image.open(root / 'base.png')
assert base.size == (600, 750)
assert base.getchannel('A').getextrema() == (255, 255)
for name, horizontal in [('mask.png', False), ('mask-horizontal.png', True)]:
    mask = Image.open(root / name)
    assert mask.size == (600, 750)
    alpha = mask.getchannel('A')
    assert alpha.getextrema() == (0, 255)
    if horizontal:
        assert all(alpha.getpixel((x, 6)) == alpha.getpixel((0, 6)) for x in range(600))
        assert len(set(alpha.getpixel((0, y)) for y in range(50))) > 1
    else:
        assert all(alpha.getpixel((6, y)) == alpha.getpixel((6, 0)) for y in range(750))
        assert len(set(alpha.getpixel((x, 0)) for x in range(50))) > 1
im = Image.open(root / 'animation.gif')
assert im.size == (360, 450)
assert im.n_frames == 20
for frame in range(im.n_frames):
    im.seek(frame)
    im.convert('RGB').load()
print('PASS: opaque base, transparent masks in both directions, and 20 decodable GIF frames.')
