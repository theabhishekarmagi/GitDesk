cask "gitdrive" do
  arch arm: "arm64", intel: "x64"

  version "1.0.0"
  sha256 :no_check

  url "https://github.com/theabhishekarmagi/GitDesk/releases/download/v#{version}/GitDrive-#{version}-#{arch}-mac.zip"
  name "GitDrive"
  desc "Turn GitHub repositories into your personal high-speed cloud drive"
  homepage "https://github.com/theabhishekarmagi/GitDesk"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: ">= :high_sierra"

  app "GitDrive.app"

  zap trash: [
    "~/Library/Application Support/GitDrive",
    "~/Library/Application Support/gitdrive",
    "~/Library/Preferences/com.gitdrive.app.plist",
    "~/Library/Saved Application State/com.gitdrive.app.savedState",
  ]
end
