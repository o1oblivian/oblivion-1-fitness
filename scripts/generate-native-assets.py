import os
import subprocess

def run(cmd):
    print(f"Running: {cmd}")
    subprocess.run(cmd, shell=True, check=True)

def main():
    os.makedirs("/tmp", exist_ok=True)
    
    # 1. Create master white emblem with subpixel alpha
    print("Generating master white emblem with alpha...")
    run("""
        convert \\( -size 1024x1024 xc:white \\) \\( public/icon-1024.png -colorspace gray -black-threshold 5% \\) -alpha off -compose CopyOpacity -composite /tmp/perfect_white_emblem.png
    """)

    # 2. Android Mipmap densities
    densities = {
        "mdpi": {"legacy": 48, "foreground": 108},
        "hdpi": {"legacy": 72, "foreground": 162},
        "xhdpi": {"legacy": 96, "foreground": 216},
        "xxhdpi": {"legacy": 144, "foreground": 324},
        "xxxhdpi": {"legacy": 192, "foreground": 432}
    }

    for density, sizes in densities.items():
        folder = f"android/app/src/main/res/mipmap-{density}"
        os.makedirs(folder, exist_ok=True)
        leg = sizes["legacy"]
        fg = sizes["foreground"]

        # Legacy square launcher icon
        run(f"convert public/icon-1024.png -resize {leg}x{leg} PNG32:{folder}/ic_launcher.png")

        # Legacy round launcher icon
        r = leg // 2
        run(f"""
            convert -size {leg}x{leg} xc:none -fill black -draw "circle {r},{r} {r},0" /tmp/circle_{leg}.png
            convert public/icon-1024.png -resize {leg}x{leg} /tmp/icon_{leg}.png
            convert /tmp/icon_{leg}.png /tmp/circle_{leg}.png -alpha set -compose DstIn -composite PNG32:{folder}/ic_launcher_round.png
        """)

        # Adaptive foreground icon
        run(f"convert /tmp/perfect_white_emblem.png -resize {fg}x{fg} PNG32:{folder}/ic_launcher_foreground.png")
        print(f"Generated mipmap-{density} icons.")

    # 3. Android Splashes
    splashes = [
        ("android/app/src/main/res/drawable/splash.png", 480, 320),
        ("android/app/src/main/res/drawable-land-mdpi/splash.png", 480, 320),
        ("android/app/src/main/res/drawable-land-hdpi/splash.png", 800, 480),
        ("android/app/src/main/res/drawable-land-xhdpi/splash.png", 1280, 720),
        ("android/app/src/main/res/drawable-land-xxhdpi/splash.png", 1600, 960),
        ("android/app/src/main/res/drawable-land-xxxhdpi/splash.png", 1920, 1280),
        ("android/app/src/main/res/drawable-port-mdpi/splash.png", 320, 480),
        ("android/app/src/main/res/drawable-port-hdpi/splash.png", 480, 800),
        ("android/app/src/main/res/drawable-port-xhdpi/splash.png", 720, 1280),
        ("android/app/src/main/res/drawable-port-xxhdpi/splash.png", 960, 1600),
        ("android/app/src/main/res/drawable-port-xxxhdpi/splash.png", 1280, 1920),
    ]

    for path, w, h in splashes:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        # Emblem size should be ~32% of min dimension
        emblem_size = max(64, int(min(w, h) * 0.32))
        run(f"""
            convert -size {w}x{h} xc:black \\( /tmp/perfect_white_emblem.png -resize {emblem_size}x{emblem_size} \\) -gravity center -composite PNG32:{path}
        """)
        print(f"Generated splash: {path}")

    # 4. iOS Splashes
    ios_splashes = [
        "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png",
        "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png",
        "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png"
    ]
    for ios_s in ios_splashes:
        os.makedirs(os.path.dirname(ios_s), exist_ok=True)
        run(f"""
            convert -size 2732x2732 xc:black \\( /tmp/perfect_white_emblem.png -resize 860x860 \\) -gravity center -composite PNG32:{ios_s}
        """)
        print(f"Generated iOS splash: {ios_s}")

    # 5. iOS AppIcon
    ios_app_icon = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
    run(f"cp public/icon-1024.png {ios_app_icon}")
    print("Copied iOS AppIcon.")

    print("All native assets generated successfully!")

if __name__ == "__main__":
    main()
