export type IconPrefix = "fas" | "fab" | "far" | "fal" | "fad";
export type IconPathData = string | string[]

export interface IconLookup {
  prefix: IconPrefix;
  // IconName is defined in the code that will be generated at build time and bundled with this file.
  iconName: IconName;
}

export interface IconDefinition extends IconLookup {
  icon: [
    number, // width
    number, // height
    string[], // ligatures
    string, // unicode
    IconPathData // svgPathData
  ];
}

export interface IconPack {
  [key: string]: IconDefinition;
}

export type IconName = 'aws' | 
  'cc-amazon-pay' | 
  'cc-amex' | 
  'cc-apple-pay' | 
  'cc-diners-club' | 
  'cc-discover' | 
  'cc-jcb' | 
  'cc-mastercard' | 
  'cc-paypal' | 
  'cc-stripe' | 
  'cc-visa' | 
  'docker' | 
  'github' | 
  'instagram' | 
  'microsoft' | 
  'rev' | 
  'slack' | 
  'twitter' | 
  'abacus' | 
  'align-slash' | 
  'atom-alt' | 
  'badge-check' | 
  'bell' | 
  'books' | 
  'brackets-curly' | 
  'chart-network' | 
  'chart-scatter' | 
  'check' | 
  'circle' | 
  'clouds' | 
  'cogs' | 
  'concierge-bell' | 
  'dot-circle' | 
  'envelope' | 
  'exchange-alt' | 
  'file-alt' | 
  'file-code' | 
  'globe' | 
  'globe-africa' | 
  'globe-americas' | 
  'globe-asia' | 
  'globe-europe' | 
  'graduation-cap' | 
  'history' | 
  'key' | 
  'key-skeleton' | 
  'laptop' | 
  'laptop-code' | 
  'laptop-house' | 
  'life-ring' | 
  'lightbulb' | 
  'list-alt' | 
  'list-ul' | 
  'lock-alt' | 
  'map-marker-alt' | 
  'moon-stars' | 
  'network-wired' | 
  'planet-ringed' | 
  'question-circle' | 
  'quote-left' | 
  'random' | 
  'rocket' | 
  'search' | 
  'server' | 
  'sign-out' | 
  'siren-on' | 
  'smile' | 
  'snowman' | 
  'sun' | 
  'tasks' | 
  'university' | 
  'user' | 
  'user-hard-hat' | 
  'user-shield' | 
  'users' | 
  'check-circle' | 
  'desktop' | 
  'eye' | 
  'file-code' | 
  'info' | 
  'info-circle' | 
  'plus' | 
  'question-circle' | 
  'rocket' | 
  'save' | 
  'slash' | 
  'times' | 
  'undo' | 
  'undo-alt' | 
  'user' | 
  'user-friends' | 
  'users' | 
  'alarm-exclamation' | 
  'align-left' | 
  'book-dead' | 
  'check' | 
  'circle' | 
  'cloud' | 
  'credit-card' | 
  'desktop' | 
  'envelope' | 
  'eye' | 
  'fingerprint' | 
  'history' | 
  'home' | 
  'plus' | 
  'robot' | 
  'rocket' | 
  'save' | 
  'slash' | 
  'spinner-third' | 
  'square-full' | 
  'times' | 
  'times-circle' | 
  'undo' | 
  'undo-alt' | 
  'user' | 
  'users';
