// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "WhiteGlove",
    platforms: [
        .iOS(.v17)
    ],
    dependencies: [
        .package(url: "https://github.com/pointfreeco/swift-dependencies", from: "1.0.0"),
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "WhiteGlove",
            dependencies: [
                .product(name: "Dependencies", package: "swift-dependencies"),
                .product(name: "Supabase", package: "supabase-swift"),
            ],
            path: "Sources",
            resources: [
                .process("App/Assets.xcassets"),
            ]
        ),
    ]
)
