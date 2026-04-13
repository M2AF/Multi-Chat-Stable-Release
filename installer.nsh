; installer.nsh — Custom NSIS script for MultiChat
; Adds "Delete user settings" option to the uninstaller

!macro customUnInstall
  ; Ask user if they want to delete their saved settings
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Do you want to delete your MultiChat settings?$\n$\nThis will remove your stream links, Discord token,$\nand appearance preferences.$\n$\nChoose No to keep your settings for future reinstalls." \
    IDNO skip_delete

    ; Delete the user data folder
    RMDir /r "$APPDATA\MultiChat"
    DetailPrint "MultiChat user data deleted."

  skip_delete:
!macroend
