/**
 * Externalized UI strings for Sidee
 * Externalizing early as specified in the Cross-Platform Plan (§9 Phase 1)
 */
export const STRINGS = {
  appTitle: 'Sidee',
  tagline: 'Your TV, your freedom.',
  forVidaa: 'For VIDAA TVs',
  eyebrow: 'A little more home',
  heroTitle: 'Your TV.\nYour apps. Your way.',
  heroSubtitle: 'Bring your favorite apps to the big screen.\nConnect once. Make yourself at home.',
  privacyTitle: 'At home, on your network.',
  privacyDesc: 'No account. No cloud. Just your TV.',
  
  // Phone access
  phoneTitle: 'Use your phone',
  phoneDesc: "TV far from your computer? Scan this QR with your phone's camera and enter the TV PIN while standing beside your TV.",
  phoneNote: 'Use the same home network on your phone, TV and computer. Keep Sidee running on the computer.',
  phonePreparing: 'Preparing your QR code…',
  
  // Setup steps
  setupTitle: 'A quick introduction to your TV.',
  setupMeta: 'Three steps. Then you\'re home.',
  setupPairedBadge: 'Paired',
  
  step1Title: 'Find your TV',
  step1DescDefault: 'Turn on your TV and connect it to the same network as this device.',
  step1SelectLabel: 'Choose your TV',
  step1FindBtn: 'Find TV',
  step1SearchingBtn: 'Searching…',
  step1ManualToggle: 'TV not found? Check its IP address',
  step1ManualLabel: "TV's local IPv4 address",
  step1ManualPlaceholder: '192.168.1.50',
  step1ManualHelp: "Use the address from the TV's network settings. Sidee checks its VIDAA identity and connection port before pairing.",
  step1ManualBtn: 'Check TV IP',
  step1CheckingBtn: 'Checking…',
  
  step2Title: 'Make the connection',
  step2HelpDefault: 'Find your TV, then click Request code to display a PIN on its screen.',
  step2HelpCodeOnTv: 'Enter the 4-digit PIN shown on your TV, then click Confirm code.',
  step2HelpConnected: 'Your TV is connected. Choose an app below.',
  step2RequestBtn: 'Request code',
  step2RequestNewBtn: 'Request new code',
  step2RequestingBtn: 'Requesting…',
  step2PinLabel: 'TV PIN',
  step2PinPlaceholder: '0000',
  step2ConfirmBtn: 'Confirm code',
  step2ConnectingBtn: 'Connecting…',
  step2PinInvalid: 'Enter all 4 digits shown on your TV.',
  
  step3Title: 'Choose what you love',
  step3Desc: 'Once paired, choose apps from the grid below. Stremio uses a TV-first interface with D-pad navigation and can also be linked to your streaming server. Then open the app from Home on your TV.',
  step3LockNote: 'Pair your TV to unlock installation',
  step3ReadyNote: "You're ready. Choose an app below.",
  
  // Multi-TV v1 Notice
  multiTvNote: 'Sidee v1 maintains one active paired TV. To pair a different TV, use "Forget this TV".',
  forgetTvBtn: 'Forget this TV',
  forgetTvConfirm: 'Forget the pairing for this TV? You will need to request a PIN if you connect again.',
  
  // Catalog
  catalogTitle: 'Meet your next favorite.',
  catalogSubtitle: 'Apps for your VIDAA TV',
  searchPlaceholder: 'Search by name or description',
  categoryAll: 'All',
  noMatch: 'No apps match your search.',
  loading: 'Loading apps…',
  install: 'Install',
  installing: 'Installing…',
  inQueue: 'In Queue',
  launch: 'Open',
  launching: 'Opening…',
  installed: 'Installed',
  unknownState: 'Not checked yet',
  remove: 'Remove',
  removeConfirm: 'Remove {name} from your custom apps?',
  installHint: 'Connect your TV above to start installing.',
  refreshStateBtn: 'Refresh installed state',
  diagnosticsBtn: 'Check my setup',
  diagnosticsRunning: 'Checking setup…',
  
  // Custom apps
  customAppToggle: 'Add a custom app',
  customAppIdLabel: 'App ID',
  customNameLabel: 'Name',
  customUrlLabel: 'App URL',
  customImageLabel: 'Icon URL · optional',
  customDescLabel: 'Description · optional',
  customCategoryLabel: 'Category',
  addCustomBtn: 'Add custom app',
  addingCustomBtn: 'Adding…',
  
  // Remote catalogue
  remoteCatalogTitle: 'Remote Catalogue',
  syncRemoteBtn: 'Check for catalogue updates',
  syncingRemote: 'Checking catalogue…',
  resetBundledBtn: 'Reset to bundled catalogue',
  
  // Diagnostics & Logs
  activityTitle: 'Connection activity',
  exportLogBtn: 'Export diagnostic log',
  exportLogTooltip: 'Download diagnostic log with all keys, tokens and PINs redacted',
  
  // Settings & Updates
  settingsTitle: 'Settings & About',
  checkUpdatesBtn: 'Check for app updates',
  checkingUpdates: 'Checking updates…',
  betaToggleLabel: 'Participate in beta pre-releases',
  
  // Banner
  bannerInstalledTitle: '{name} is home.',
  bannerInstalledText: 'Press Home on your TV and select its tile. You can stop Sidee with Quit Sidee on macOS or Ctrl+C on Windows.',
  
  // Native mode note (§3 & §12)
  nativeModeTitle: 'Native packages excluded in v1',
  nativeModeDesc: 'Sidee installs web-app launcher tiles using the TV\'s authorized interface. Native system package installs are deliberately excluded in v1 to protect device stability and user safety.',
  
  // Legal & Trademarks (§7)
  trademarkNotice: 'Nuvio, Stremio, and Jellyfin are trademarks of their respective projects. Sidee is an independent open-source tool and is not affiliated with TV manufacturers or app creators.',
};
