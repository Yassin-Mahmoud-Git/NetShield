export type AppMode = 'network' | 'osi' | 'security' | 'threats' | 'crypto';

export type ThreatScenario =
  | 'normal'
  | 'phishing'
  | 'bruteforce'
  | 'ddos'
  | 'mitm'
  | 'portscan'
  | 'sqli'
  | 'xss'
  | 'csrf'
  | 'ransomware'
  | 'dnsspoof'
  | 'arpspoof';

export type NodeId =
  | 'client'
  | 'dns'
  | 'router'
  | 'firewall'
  | 'switch'
  | 'webserver'
  | 'database'
  | 'attacker';

export interface NetworkNodeInfo {
  id: NodeId;
  name: string;
  shortLabel: string;
  zone: string;
  osiLayer: string;
  ipAddress: string;
  position: [number, number, number];
  labelOffsetY: number;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  networkRole: string;
  securityRole: string;
  protocols: string[];
  threatsAndDefenses: {
    threat: string;
    defense: string;
  };
}

export interface OsiLayerInfo {
  layer: number;
  name: string;
  pdu: string;
  colorHex: string;
  protocols: string;
  networkFunction: string;
  attackVector: string;
  securityControl: string;
  headerExample: string;
}

export interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  focusNode: NodeId | 'osi' | 'overview';
  mode: AppMode;
  threatScenario: ThreatScenario;
  firewallEnabled: boolean;
  tlsEnabled: boolean;
  zeroTrustEnabled: boolean;
  explodeFactor: number;
  explanation: string;
  keyTakeaway: string;
}

export interface PacketLayerBreakdown {
  layer: string;
  headerName: string;
  plaintextFields: { label: string; value: string }[];
  encryptedNote?: string;
}

export interface ThreatScenarioMeta {
  id: ThreatScenario;
  label: string;
  category: string;
  severity: 'Baseline' | 'High' | 'Critical';
  title: string;
  target: string;
  howAttackWorks: string;
  realExample: string;
  howToDefend: string;
  requiredDefense: 'firewall' | 'tls' | 'zerotrust';
}

export interface PortReference {
  port: string;
  protocol: string;
  service: string;
  transport: string;
  riskNote: string;
}

export interface CyberConceptCard {
  title: string;
  summary: string;
  details: string;
}

export interface MalwareThreatEntry {
  term: string;
  category: string;
  description: string;
  defense: string;
  relatedScenario?: ThreatScenario;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  focusNode: NodeId | 'osi';
}

export const NETWORK_NODES: Record<NodeId, NetworkNodeInfo> = {
  client: {
    id: 'client',
    name: 'Client Workstation',
    shortLabel: 'Client Host',
    zone: 'Internal LAN',
    osiLayer: 'Layers 1–7',
    ipAddress: '192.168.10.42',
    position: [-14, 0, 4.2],
    labelOffsetY: 3.1,
    cameraPos: [-18.5, 4.8, 10.5],
    cameraTarget: [-13.5, 1.2, 4.2],
    networkRole:
      'Originates outbound requests using an ephemeral source port (e.g., 54312), wraps payloads in TCP/IP headers, and uses ARP + DNS before opening a session.',
    securityRole:
      'Verifies the remote server X.509 certificate during a TLS 1.3 handshake, enforces endpoint EDR policies, and isolates untrusted browser processes.',
    protocols: ['HTTPS / TLS 1.3', 'DNS', 'DHCP', 'ARP'],
    threatsAndDefenses: {
      threat: 'Phishing, XSS cookie theft, ransomware execution, and rogue Wi-Fi sniffing',
      defense: 'FIDO2 hardware MFA, EDR process isolation, and strict browser CSP/HTTPS',
    },
  },
  dns: {
    id: 'dns',
    name: 'Recursive DNS Resolver',
    shortLabel: 'DNS Resolver',
    zone: 'Control Plane',
    osiLayer: 'Layer 7 (UDP/TCP 53)',
    ipAddress: '10.0.0.53',
    position: [-8.2, 0, -6.2],
    labelOffsetY: 3.6,
    cameraPos: [-11.5, 5.2, -0.5],
    cameraTarget: [-8.2, 1.6, -6.2],
    networkRole:
      'Translates human-readable domain names (app.netshield.io) into routable IPv4/IPv6 addresses via hierarchical root, TLD, and authoritative queries.',
    securityRole:
      'Validates cryptographic DNSSEC signatures to prevent cache poisoning and blocks known malicious command-and-control domains at query time.',
    protocols: ['DNS (UDP 53)', 'DoH (TCP 443)', 'DNSSEC'],
    threatsAndDefenses: {
      threat: 'DNS spoofing, cache poisoning, and DNS tunneling exfiltration',
      defense: 'DNSSEC cryptographic validation and DNS-over-HTTPS (DoH)',
    },
  },
  router: {
    id: 'router',
    name: 'Edge Router & NAT Gateway',
    shortLabel: 'Edge Router',
    zone: 'Network Perimeter',
    osiLayer: 'Layer 3 (Network)',
    ipAddress: '203.0.113.1',
    position: [-5.6, 0, 2.2],
    labelOffsetY: 2.9,
    cameraPos: [-8.5, 4.6, 8.8],
    cameraTarget: [-5.6, 1.1, 2.2],
    networkRole:
      'Inspects destination IP headers, consults BGP/OSPF routing tables to pick the optimal next hop, and performs Network Address Translation (NAT) between private LAN and public WAN.',
    securityRole:
      'Applies ingress anti-spoofing filters (uRPF / BCP 38), drops malformed IP fragments, and enforces edge rate-limiting before traffic reaches internal zones.',
    protocols: ['IPv4 / IPv6', 'BGP', 'OSPF', 'NAT / PAT'],
    threatsAndDefenses: {
      threat: 'BGP route hijacking, IP spoofing, and volumetric DDoS floods',
      defense: 'RPKI route origin validation, uRPF filtering, and edge scrubbing',
    },
  },
  firewall: {
    id: 'firewall',
    name: 'Stateful Firewall & IDS/IPS',
    shortLabel: 'Firewall / IPS',
    zone: 'Security Chokepoint',
    osiLayer: 'Layers 3–7',
    ipAddress: '10.0.1.1',
    position: [0.2, 0, 1.4],
    labelOffsetY: 4.1,
    cameraPos: [-2.8, 5.5, 9.2],
    cameraTarget: [0.2, 1.8, 1.4],
    networkRole:
      'Tracks active TCP connection state tables (SYN, SYN-ACK, ACK) and forwards inspected streams across security zones with deterministic policy enforcement.',
    securityRole:
      'Evaluates 5-tuple Access Control Lists (src/dst IP, port, protocol), drops unauthorized port scans, blocks C2 callbacks, and runs Deep Packet Inspection (IPS).',
    protocols: ['Stateful ACL', 'TLS Inspection', 'Snort / Suricata Rules'],
    threatsAndDefenses: {
      threat: 'Port scanning, brute-force floods, C2 beaconing, and exploit payloads',
      defense: 'Default-deny firewall ruleset paired with rate-limiting and signature IPS',
    },
  },
  switch: {
    id: 'switch',
    name: 'Core L3 Switch & Load Balancer',
    shortLabel: 'Core Switch',
    zone: 'Data Center Fabric',
    osiLayer: 'Layers 2–4',
    ipAddress: '10.0.2.2',
    position: [6.4, 0, 1.4],
    labelOffsetY: 3.1,
    cameraPos: [4.2, 4.8, 8.6],
    cameraTarget: [6.4, 1.2, 1.4],
    networkRole:
      'Forwards Ethernet frames at wire speed using MAC address CAM tables, isolates broadcast domains with 802.1Q VLANs, and distributes sessions across backend nodes.',
    securityRole:
      'Enforces 802.1X port authentication, Dynamic ARP Inspection (DAI), and health-checked traffic shedding so a single overloaded node cannot cascade across the fabric.',
    protocols: ['Ethernet 802.3', '802.1Q VLAN', 'LACP', 'ECMP'],
    threatsAndDefenses: {
      threat: 'ARP cache spoofing, MAC flooding, and VLAN hopping',
      defense: 'Dynamic ARP Inspection (DAI), DHCP snooping, and 802.1X NAC',
    },
  },
  webserver: {
    id: 'webserver',
    name: 'DMZ Web & TLS Termination Vault',
    shortLabel: 'Web / TLS Server',
    zone: 'DMZ Tier',
    osiLayer: 'Layers 4–7',
    ipAddress: '10.0.10.25',
    position: [12.0, 0, -4.4],
    labelOffsetY: 4.3,
    cameraPos: [7.6, 5.2, -0.4],
    cameraTarget: [12.0, 1.8, -4.4],
    networkRole:
      'Accepts TCP connections on port 443, terminates TLS sessions, serves application API responses, and forwards authenticated business queries to the internal data tier.',
    securityRole:
      'Protects private keys in Hardware Security Modules (HSM), enforces Forward Secrecy (ECDHE + AES-256-GCM), and filters HTTP payloads via Web Application Firewall (WAF) rules.',
    protocols: ['HTTP/3 (QUIC)', 'TLS 1.3', 'AES-256-GCM', 'WAF'],
    threatsAndDefenses: {
      threat: 'XSS, CSRF, brute-force credential stuffing, and TLS downgrade attacks',
      defense: 'Strict TLS 1.3, CSP headers, anti-CSRF tokens, and WAF sanitization',
    },
  },
  database: {
    id: 'database',
    name: 'Zero-Trust Database Cluster',
    shortLabel: 'DB Vault',
    zone: 'Restricted Core',
    osiLayer: 'Layers 5–7',
    ipAddress: '10.0.99.10',
    position: [12.6, 0, 5.4],
    labelOffsetY: 3.7,
    cameraPos: [8.4, 4.9, 10.6],
    cameraTarget: [12.6, 1.5, 5.4],
    networkRole:
      'Persists structured application state across redundant RAID storage silos and responds only to parameterized queries arriving over an isolated private subnet.',
    securityRole:
      'Protected by Zero-Trust micro-segmentation (mTLS required from authorized app identities only), transparent encryption at rest, and immutable backups.',
    protocols: ['PostgreSQL (5432)', 'mTLS', 'AES-256-XTS At-Rest'],
    threatsAndDefenses: {
      threat: 'SQL injection, ransomware encryption, and lateral credential theft',
      defense: 'Zero-Trust micro-segmentation, mTLS identity checks, and prepared statements',
    },
  },
  attacker: {
    id: 'attacker',
    name: 'External Threat Actor & Sniffer',
    shortLabel: 'Threat Node',
    zone: 'Untrusted WAN',
    osiLayer: 'Layers 2–7',
    ipAddress: '198.51.100.77',
    position: [-2.4, 0, -9.2],
    labelOffsetY: 3.1,
    cameraPos: [-6.4, 5.0, -3.2],
    cameraTarget: [-2.4, 1.2, -9.2],
    networkRole:
      'Operates from an external autonomous system on the public internet, probing reachable IP ranges and attempting to intercept transit packets between hops.',
    securityRole:
      'Models real-world adversarial tactics across all 11 attack drills: Phishing, Brute Force, DDoS, MitM, Port Scan, SQLi, XSS, CSRF, Ransomware, DNS Spoofing, and ARP Poisoning.',
    protocols: ['SYN Flood', 'Phishing Lure', 'XSS / SQLi', 'ARP / DNS Spoof'],
    threatsAndDefenses: {
      threat: 'Credential theft, eavesdropping, lateral ransomware, and service disruption',
      defense: 'Defense-in-Depth: MFA + TLS 1.3 + Stateful Firewall + WAF + Zero-Trust',
    },
  },
};

export const OSI_LAYERS: OsiLayerInfo[] = [
  {
    layer: 7,
    name: 'Application',
    pdu: 'Data',
    colorHex: '#38bdf8',
    protocols: 'HTTP/3, DNS, SMTP, SSH',
    networkFunction:
      'Provides the direct network interface for user applications, formatting API requests, domain lookups, and web documents.',
    attackVector: 'SQL Injection, XSS, CSRF, Phishing, DNS Tunneling',
    securityControl:
      'Web Application Firewalls (WAF), OAuth 2.0 / OIDC authorization, DNSSEC, and strict input validation.',
    headerExample: 'GET /api/vault HTTP/2 · Host: app.netshield.io',
  },
  {
    layer: 6,
    name: 'Presentation',
    pdu: 'Data',
    colorHex: '#2dd4bf',
    protocols: 'TLS 1.3, X.509, JSON, UTF-8',
    networkFunction:
      'Handles data encoding, compression, and serialization so heterogeneous systems interpret payloads identically.',
    attackVector: 'TLS Downgrade Attacks (POODLE/BEAST), Weak Ciphers, Expired Certificates',
    securityControl:
      'Cryptographic confidentiality and integrity via TLS 1.3 (ECDHE key exchange + AES-256-GCM / ChaCha20).',
    headerExample: 'TLS 1.3 Record · Cipher: TLS_AES_256_GCM_SHA384',
  },
  {
    layer: 5,
    name: 'Session',
    pdu: 'Data',
    colorHex: '#34d399',
    protocols: 'TLS Session Tickets, RPC, Cookies',
    networkFunction:
      'Establishes, maintains, checkpoints, and gracefully tears down logical dialogs between communicating endpoints.',
    attackVector: 'Session Hijacking, Token Replay, Cross-Site Request Forgery (CSRF)',
    securityControl:
      'Short-lived session tokens, SameSite=Strict HttpOnly cookies, mutual TLS (mTLS), and idle timeout revocation.',
    headerExample: 'Session ID: 9f4c...a812 · Keep-Alive: 60s',
  },
  {
    layer: 4,
    name: 'Transport',
    pdu: 'Segment / Datagram',
    colorHex: '#a78bfa',
    protocols: 'TCP, UDP, QUIC',
    networkFunction:
      'Multiplexes applications via port numbers (80, 443, 53) and provides reliable ordered delivery (TCP 3-way handshake) or low-latency streams (UDP).',
    attackVector: 'SYN Flood DDoS, TCP Reset Injection, Port Scanning Reconnaissance',
    securityControl:
      'SYN-cookie flood mitigation, stateful connection tracking, and port-based firewall filtering.',
    headerExample: 'SrcPort: 54312 → DstPort: 443 · Flags: [ACK, PSH]',
  },
  {
    layer: 3,
    name: 'Network',
    pdu: 'Packet',
    colorHex: '#f59e0b',
    protocols: 'IPv4, IPv6, ICMP, BGP, OSPF',
    networkFunction:
      'Assigns logical IP addresses and determines best-path routing across interconnected autonomous networks.',
    attackVector: 'IP Spoofing, Smurf ICMP Amplification, BGP Route Hijacking',
    securityControl:
      'IPsec tunnels, ingress anti-spoofing (uRPF / BCP 38), RPKI route validation, and Layer-3 ACLs.',
    headerExample: 'SrcIP: 192.168.10.42 → DstIP: 10.0.10.25 · TTL: 63',
  },
  {
    layer: 2,
    name: 'Data Link',
    pdu: 'Frame',
    colorHex: '#fb923c',
    protocols: 'Ethernet 802.3, Wi-Fi 802.11, ARP, VLAN',
    networkFunction:
      'Frames packets for hop-to-hop delivery on a local segment using hardware MAC addresses and CRC error detection.',
    attackVector: 'ARP Cache Poisoning (LAN MitM), MAC Flooding, VLAN Hopping',
    securityControl:
      '802.1X Network Access Control, MACsec link encryption, and Dynamic ARP Inspection (DAI).',
    headerExample: 'SrcMAC: A4:83:E7:19:02:11 → DstMAC: 00:1B:44:11:3A:B7',
  },
  {
    layer: 1,
    name: 'Physical',
    pdu: 'Bits / Pulses',
    colorHex: '#f43f5e',
    protocols: '10GbE Fiber, Cat6a Copper, RF Spectrum',
    networkFunction:
      'Transmits raw binary 1s and 0s as optical light pulses, electrical voltage shifts, or radio waves across physical media.',
    attackVector: 'Fiber Optic Tapping, RF Jamming, Rogue Hardware USB Implants',
    securityControl:
      'Physical rack locks, optical attenuation monitoring, shielded cabling, and USB port lockdowns.',
    headerExample: '10001011 01001101 11100010 (10GBASE-SR Optical)',
  },
];

export const THREAT_SCENARIOS: ThreatScenarioMeta[] = [
  {
    id: 'normal',
    label: 'Normal Flow',
    category: 'Healthy Baseline',
    severity: 'Baseline',
    title: 'Verified Encrypted Application Traffic',
    target: 'Client → Web Server → DB Vault',
    howAttackWorks:
      'Baseline operation with zero active attacks. Client resolves DNS, performs a TCP handshake on port 443, and sends encrypted HTTPS requests.',
    realExample: 'Standard banking or SaaS login session protected by TLS 1.3 and Zero-Trust.',
    howToDefend:
      'Keep TLS 1.3 active, enforce default-deny perimeter firewall ACLs, and isolate internal DB tiers.',
    requiredDefense: 'tls',
  },
  {
    id: 'phishing',
    label: 'Phishing',
    category: 'Social Engineering · L7',
    severity: 'Critical',
    title: 'Phishing & Credential Harvesting',
    target: 'Client Workstation User',
    howAttackWorks:
      'Attackers send a deceptive email or cloned login page (`netsh1eld-login.com`) to trick a user into typing their password and leaking session credentials.',
    realExample: '90%+ of enterprise breaches begin with a targeted phishing email or fake SSO prompt.',
    howToDefend:
      'Enable Phishing-Resistant MFA (FIDO2/WebAuthn hardware keys bound to real domains), Zero-Trust device verification, and DMARC/SPF email filtering.',
    requiredDefense: 'zerotrust',
  },
  {
    id: 'bruteforce',
    label: 'Brute Force',
    category: 'Credential Attack · L7',
    severity: 'High',
    title: 'Brute Force & Credential Stuffing',
    target: 'DMZ Web Login (:443) & SSH (:22)',
    howAttackWorks:
      'Automated scripts rapidly test millions of common passwords or leaked username/password pairs from prior breaches against public login portals.',
    realExample: 'Bots spraying "Password123!" across thousands of employee accounts to avoid single-account lockouts.',
    howToDefend:
      'Enable Perimeter Rate Limiting & IDS, enforce MFA, use strong Argon2 password hashing, and block port 22 from the public internet.',
    requiredDefense: 'firewall',
  },
  {
    id: 'ddos',
    label: 'DDoS Flood',
    category: 'Availability · L3/L4',
    severity: 'Critical',
    title: 'Volumetric & SYN Flood Denial of Service',
    target: 'Edge Router & DMZ Web Server',
    howAttackWorks:
      'Botnets flood the perimeter with millions of half-open TCP SYN packets and junk UDP payloads to saturate bandwidth and crash server memory.',
    realExample: 'Mirai IoT botnet knocking major DNS providers and websites offline.',
    howToDefend:
      'Enable Stateful Firewall & Edge Rate Limiting: SYN cookies validate real clients without allocating memory, and scrubbing drops flood traffic.',
    requiredDefense: 'firewall',
  },
  {
    id: 'mitm',
    label: 'MitM Sniffing',
    category: 'Eavesdropping · L2–L6',
    severity: 'Critical',
    title: 'Man-in-the-Middle (MitM) Interception',
    target: 'Client ↔ Edge Router Transit Link',
    howAttackWorks:
      'An attacker taps untrusted public Wi-Fi or an upstream router to silently read HTTP traffic, passwords, and API tokens moving across the wire.',
    realExample: 'Coffee-shop "Evil Twin" Wi-Fi hotspot intercepting unencrypted HTTP traffic.',
    howToDefend:
      'Enable TLS 1.3 Encryption Tunnel: ECDHE + AES-256-GCM scrambles payloads into unreadable ciphertext even if every packet is captured.',
    requiredDefense: 'tls',
  },
  {
    id: 'portscan',
    label: 'Port Scan',
    category: 'Reconnaissance · L4',
    severity: 'High',
    title: 'Automated Port Reconnaissance & Probing',
    target: 'Perimeter Ports (:22, :80, :443, :5432)',
    howAttackWorks:
      'Attackers run tools like Nmap to probe every TCP/UDP port on your IP, discovering open SSH, RDP, or unpatched database services.',
    realExample: 'Automated internet scanners finding an accidentally exposed PostgreSQL port 5432 within minutes.',
    howToDefend:
      'Enable Stateful Firewall ACLs: enforce default-deny rules exposing only port 443 externally and silently dropping unsolicited probes.',
    requiredDefense: 'firewall',
  },
  {
    id: 'sqli',
    label: 'SQL Injection',
    category: 'Injection · L7',
    severity: 'Critical',
    title: 'SQL Injection & Lateral Database Pivot',
    target: 'DMZ Web Server → Database Vault (:5432)',
    howAttackWorks:
      'An attacker submits database code inside a web form (e.g., `admin\' OR 1=1 --`) to dump user tables or pivot from the Web Server to the Database.',
    realExample: 'Classic OWASP #1 injection flaw exposing millions of customer records in a single HTTP request.',
    howToDefend:
      'Use Parameterized Queries (Prepared Statements), enable Zero-Trust Micro-Segmentation (mTLS), and deploy a Layer-7 WAF.',
    requiredDefense: 'zerotrust',
  },
  {
    id: 'xss',
    label: 'XSS Script',
    category: 'Client Injection · L7',
    severity: 'High',
    title: 'Cross-Site Scripting (XSS)',
    target: 'DMZ Web Server → Client Browser',
    howAttackWorks:
      'An attacker stores malicious `<script>` code in a comment or profile field; when another user loads the page, their browser executes it and leaks cookies.',
    realExample: 'Malicious JavaScript stealing session tokens from logged-in admins viewing a support ticket.',
    howToDefend:
      'Sanitize and HTML-encode all output, enforce a strict Content Security Policy (CSP), mark cookies `HttpOnly`, and enable WAF filtering.',
    requiredDefense: 'firewall',
  },
  {
    id: 'csrf',
    label: 'CSRF Forgery',
    category: 'Session Abuse · L5/L7',
    severity: 'High',
    title: 'Cross-Site Request Forgery (CSRF)',
    target: 'Authenticated Client Browser → Web API',
    howAttackWorks:
      'While logged into a trusted app, a user visits a malicious page that silently submits a hidden form transfer request using the user’s valid browser cookies.',
    realExample: 'Tricking an authenticated router admin into clicking a link that quietly changes router DNS settings.',
    howToDefend:
      'Enforce cryptographic Anti-CSRF tokens on every state-changing request, set `SameSite=Strict` on cookies, and require mTLS/re-auth.',
    requiredDefense: 'zerotrust',
  },
  {
    id: 'ransomware',
    label: 'Ransomware',
    category: 'Malware & Lateral · L4–L7',
    severity: 'Critical',
    title: 'Ransomware C2 Beaconing & Lateral Spread',
    target: 'Client → Attacker C2 → Database Vault',
    howAttackWorks:
      'After executing on a workstation, ransomware contacts an external Command-and-Control (C2) server for encryption keys and spreads laterally to lock databases.',
    realExample: 'WannaCry / enterprise ransomware locking shared network drives and demanding cryptocurrency.',
    howToDefend:
      'Block C2 callbacks at the Firewall/DNS, isolate Database subnets with Zero-Trust segmentation, run EDR, and keep immutable offline backups.',
    requiredDefense: 'zerotrust',
  },
  {
    id: 'dnsspoof',
    label: 'DNS Spoofing',
    category: 'Control Plane · L7',
    severity: 'High',
    title: 'DNS Cache Poisoning & Redirection',
    target: 'Recursive DNS Resolver (:53)',
    howAttackWorks:
      'Attackers race to inject forged IP records into a DNS resolver cache, silently redirecting users typing a legitimate domain to a malicious server.',
    realExample: 'Hijacking `bank.example.com` lookups so browsers connect to an attacker IP.',
    howToDefend:
      'Enable DNSSEC cryptographic signatures and encrypted DNS-over-HTTPS (DoH) so unsigned forged responses are rejected.',
    requiredDefense: 'firewall',
  },
  {
    id: 'arpspoof',
    label: 'ARP Spoofing',
    category: 'LAN Poisoning · L2',
    severity: 'High',
    title: 'ARP Cache Poisoning on Local Switch',
    target: 'Client ↔ Switch ↔ Router (Layer 2)',
    howAttackWorks:
      'On a local network, an attacker broadcasts fake ARP replies claiming "I am the Router MAC address," rerouting all LAN frames through their machine.',
    realExample: 'Rogue laptop on an office Ethernet jack intercepting local printer and gateway traffic.',
    howToDefend:
      'Enable Dynamic ARP Inspection (DAI) + DHCP Snooping on switches, 802.1X port auth, and TLS 1.3 so intercepted frames stay encrypted.',
    requiredDefense: 'tls',
  },
];

export const CYBER_CORE_CONCEPTS: CyberConceptCard[] = [
  {
    title: 'The CIA Triad',
    summary: 'Confidentiality · Integrity · Availability',
    details:
      'Every security control protects one or more pillars: Confidentiality keeps secrets private (TLS/AES), Integrity proves data was not altered (HMAC/SHA-256), and Availability keeps systems online (Redundancy/DDoS scrubbing).',
  },
  {
    title: 'AAA Framework',
    summary: 'Authentication · Authorization · Accounting',
    details:
      'Authentication proves who you are (Password + MFA). Authorization defines what you can touch (Least Privilege / RBAC). Accounting logs every action for forensics and incident response.',
  },
  {
    title: 'Defense-in-Depth & Zero-Trust',
    summary: 'Never trust, always verify at every boundary',
    details:
      'Instead of relying on one outer firewall, layer multiple independent controls (EDR + TLS + Firewall + WAF + mTLS segmentation) so a single bypass never compromises the crown jewels.',
  },
];

export const MALWARE_GLOSSARY: MalwareThreatEntry[] = [
  {
    term: 'Ransomware',
    category: 'Extortion Malware',
    description: 'Encrypts victim files and databases using strong cryptography and demands payment for the decryption key.',
    defense: 'Immutable offline backups, EDR behavioral blocking, and Zero-Trust network isolation.',
    relatedScenario: 'ransomware',
  },
  {
    term: 'Trojan vs. Worm',
    category: 'Propagation Mechanism',
    description: 'A Trojan disguises itself as legitimate software to trick users; a Worm self-replicates automatically across network vulnerabilities without user clicks.',
    defense: 'Least-privilege execution, rapid vulnerability patching (CVEs), and internal firewall segmentation.',
    relatedScenario: 'portscan',
  },
  {
    term: 'Phishing & Pretexting',
    category: 'Social Engineering',
    description: 'Manipulating human trust via urgent emails, SMS (Smishing), or fake SSO login pages rather than attacking software bugs directly.',
    defense: 'FIDO2 hardware security keys (domain-bound), DMARC/DKIM email auth, and security training.',
    relatedScenario: 'phishing',
  },
  {
    term: 'Zero-Day & Vulnerability (CVE)',
    category: 'Software Flaw',
    description: 'A Zero-Day is a newly discovered flaw with no vendor patch yet. Known vulnerabilities are cataloged with public CVE IDs and severity scores (CVSS).',
    defense: 'Automated patching, virtual WAF rules, attack-surface minimization, and runtime sandboxing.',
    relatedScenario: 'sqli',
  },
];

export const AUTH_CONCEPTS: CyberConceptCard[] = [
  {
    title: 'Salted Password Hashing (Argon2id)',
    summary: 'Never store plaintext or reversible passwords',
    details:
      'Servers add a unique random Salt to each password and run a slow one-way hash (Argon2id / bcrypt). Even if a database is leaked, attackers cannot easily reverse passwords or use rainbow tables.',
  },
  {
    title: 'Multi-Factor Authentication (MFA / FIDO2)',
    summary: 'Something you know + have + are',
    details:
      'Passwords alone fail against phishing and credential stuffing. Authenticator TOTP codes help, while FIDO2/Passkey hardware keys cryptographically bind to the real domain—stopping phishing completely.',
  },
  {
    title: 'Cookies, JWTs & OAuth 2.0',
    summary: 'How modern web apps keep you logged in safely',
    details:
      'Secure apps issue short-lived signed tokens or `HttpOnly; Secure; SameSite=Strict` session cookies so client-side JavaScript (XSS) and third-party sites (CSRF) cannot steal or abuse them.',
  },
];

export const PORT_REFERENCES: PortReference[] = [
  { port: '21 / 22', protocol: 'FTP / SSH', service: 'File Transfer / Encrypted Shell', transport: 'TCP', riskNote: 'Replace FTP with SFTP; restrict SSH to Bastion + Key Auth' },
  { port: '25 / 587', protocol: 'SMTP', service: 'Email Routing & Submission', transport: 'TCP', riskNote: 'Enforce SPF, DKIM, DMARC & STARTTLS against spoofing' },
  { port: '53', protocol: 'DNS', service: 'Domain Name Resolution', transport: 'UDP / TCP', riskNote: 'Protect with DNSSEC & encrypted DoH (443)' },
  { port: '80 / 443', protocol: 'HTTP / HTTPS', service: 'Web & TLS 1.3 Encrypted APIs', transport: 'TCP / QUIC', riskNote: 'Redirect 80 → 443; protect 443 with HSTS & WAF' },
  { port: '3389', protocol: 'RDP', service: 'Windows Remote Desktop', transport: 'TCP / UDP', riskNote: 'Top ransomware entry point — never expose directly to WAN' },
  { port: '5432 / 3306', protocol: 'Postgres / MySQL', service: 'Relational Databases', transport: 'TCP', riskNote: 'Zero-Trust private subnet + mTLS only' },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Which OSI layer is responsible for logical IP addressing and best-path routing between separate networks?',
    options: ['Layer 2 — Data Link', 'Layer 3 — Network', 'Layer 4 — Transport', 'Layer 6 — Presentation'],
    correctIndex: 1,
    explanation: 'Layer 3 (Network) uses IPv4/IPv6 addresses and routers (OSPF/BGP) to move packets across networks; Layer 2 handles local MAC switching.',
    focusNode: 'router',
  },
  {
    id: 'q2',
    question: 'If an attacker taps the Wi-Fi or fiber link between a client and router (MitM), which defense keeps credentials unreadable?',
    options: ['NAT Port Translation', 'TLS 1.3 Encryption', 'ICMP Ping Blocking', 'VLAN Tagging'],
    correctIndex: 1,
    explanation: 'TLS 1.3 encrypts Layer 6/7 payloads with AES-256-GCM or ChaCha20, ensuring sniffed packets reveal only ciphertext.',
    focusNode: 'attacker',
  },
  {
    id: 'q3',
    question: 'Which authentication factor is specifically resistant to look-alike Phishing login websites?',
    options: ['SMS Text Codes', 'FIDO2 / WebAuthn Passkeys', 'Security Questions', 'MD5 Password Hashing'],
    correctIndex: 1,
    explanation: 'FIDO2 hardware keys/Passkeys verify the exact cryptographic origin domain of the website, refusing to sign logins on fake phishing domains.',
    focusNode: 'client',
  },
  {
    id: 'q4',
    question: 'What is the primary defense against SQL Injection (SQLi) on web applications?',
    options: ['Disabling HTTPS', 'Parameterized Queries (Prepared Statements)', 'Opening Port 5432', 'Using UDP instead of TCP'],
    correctIndex: 1,
    explanation: 'Parameterized queries separate SQL code structure from user-supplied data so malicious inputs like `OR 1=1` are never executed as commands.',
    focusNode: 'database',
  },
  {
    id: 'q5',
    question: 'How do websites prevent malicious JavaScript (XSS) from stealing a user’s session cookie?',
    options: ['Store passwords in LocalStorage', 'Set the HttpOnly cookie flag + strict CSP', 'Use HTTP Port 80', 'Disable TLS certificates'],
    correctIndex: 1,
    explanation: 'The `HttpOnly` flag prevents `document.cookie` JavaScript access, while a Content Security Policy (CSP) blocks unauthorized inline scripts.',
    focusNode: 'webserver',
  },
  {
    id: 'q6',
    question: 'What is the correct sequence of packets in a reliable TCP 3-Way Handshake?',
    options: ['ACK → SYN → FIN', 'SYN → SYN-ACK → ACK', 'HELLO → KEY → DATA', 'GET → 200 OK → ACK'],
    correctIndex: 1,
    explanation: 'The client sends SYN, the server replies SYN-ACK, and the client confirms with ACK before application data flows.',
    focusNode: 'client',
  },
  {
    id: 'q7',
    question: 'Why does Zero-Trust micro-segmentation isolate the Database Vault even behind a perimeter firewall?',
    options: [
      'To speed up DNS lookups',
      'To block lateral movement (e.g., Ransomware) if a DMZ server is compromised',
      'To replace MAC addresses with IPv6',
      'To disable TLS certificates internally',
    ],
    correctIndex: 1,
    explanation: 'Defense-in-depth assumes perimeter breaches can occur; Zero-Trust requires mTLS identity verification at every internal boundary.',
    focusNode: 'database',
  },
  {
    id: 'q8',
    question: 'In the CIA Triad, what pillar does a DDoS Scrubbing Firewall & Load Balancer primarily protect?',
    options: ['Confidentiality', 'Integrity', 'Availability', 'Non-Repudiation'],
    correctIndex: 2,
    explanation: 'DDoS attacks aim to take services offline; scrubbing flood traffic and load balancing preserve Availability for legitimate users.',
    focusNode: 'firewall',
  },
];

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'step-overview',
    title: '01. End-to-End Network Fabric',
    subtitle: 'How packets cross zones from client to core',
    focusNode: 'overview',
    mode: 'network',
    threatScenario: 'normal',
    firewallEnabled: true,
    tlsEnabled: true,
    zeroTrustEnabled: true,
    explodeFactor: 0,
    explanation:
      'Every web request travels across distinct trust boundaries: from an internal LAN client through DNS lookup, edge routing, perimeter security inspection, core switching, and finally into DMZ and restricted database tiers.',
    keyTakeaway:
      'Networking moves bytes reliably between addresses; cybersecurity verifies who is allowed to speak and keeps payloads confidential in transit.',
  },
  {
    id: 'step-dns-routing',
    title: '02. DNS Resolution & Layer-3 Routing',
    subtitle: 'Turning names into IP paths across networks',
    focusNode: 'dns',
    mode: 'network',
    threatScenario: 'normal',
    firewallEnabled: true,
    tlsEnabled: true,
    zeroTrustEnabled: true,
    explodeFactor: 0,
    explanation:
      'Before sending data, the Client queries the Recursive DNS Resolver (UDP/53 or DoH 443) to map a domain name to an IP address. The Edge Router then uses IP routing tables and NAT to forward packets across the perimeter.',
    keyTakeaway:
      'Without DNSSEC and BGP validation, attackers can redirect traffic to rogue servers before a connection even starts.',
  },
  {
    id: 'step-osi',
    title: '03. The 7-Layer OSI Encapsulation Stack',
    subtitle: 'Every header wraps a layer of network & security logic',
    focusNode: 'osi',
    mode: 'osi',
    threatScenario: 'normal',
    firewallEnabled: true,
    tlsEnabled: true,
    zeroTrustEnabled: true,
    explodeFactor: 0.9,
    explanation:
      'As data leaves an application (Layer 7), each lower layer wraps it in its own header: TLS encryption (L6), TCP ports (L4), IP routing addresses (L3), and Ethernet MAC frames (L2) down to optical bits (L1).',
    keyTakeaway:
      'Understanding which OSI layer a protocol operates on tells you immediately which threats exist there and what defense stops them.',
  },
  {
    id: 'step-tls',
    title: '04. Man-in-the-Middle vs. TLS 1.3 Tunnel',
    subtitle: 'Why encryption defeats passive network sniffing',
    focusNode: 'attacker',
    mode: 'threats',
    threatScenario: 'mitm',
    firewallEnabled: true,
    tlsEnabled: true,
    zeroTrustEnabled: true,
    explodeFactor: 0,
    explanation:
      'Even when an external sniffer taps the transit link between Client and Router, TLS 1.3 wraps the HTTP payload in authenticated AES-256-GCM ciphertext. Toggle TLS off in the controls to see plaintext exposure.',
    keyTakeaway:
      'Network confidentiality assumes the wire itself is untrusted—encryption protects the payload regardless of who observes the link.',
  },
  {
    id: 'step-firewall',
    title: '05. Perimeter Firewall & DDoS Scrubbing',
    subtitle: 'Stateful inspection and volumetric flood defense',
    focusNode: 'firewall',
    mode: 'threats',
    threatScenario: 'ddos',
    firewallEnabled: true,
    tlsEnabled: true,
    zeroTrustEnabled: true,
    explodeFactor: 0,
    explanation:
      'During a volumetric DDoS flood or brute-force spray, hundreds of malicious packets hammer the edge. The Stateful Firewall and Rate Limiter shatter illegitimate traffic at the barrier while letting verified user sessions pass.',
    keyTakeaway:
      'State tables and rate thresholds separate legitimate user connections from automated flood traffic at wire speed.',
  },
  {
    id: 'step-zerotrust',
    title: '06. Zero-Trust Against Ransomware & SQLi',
    subtitle: 'Defense in depth inside the internal network',
    focusNode: 'database',
    mode: 'threats',
    threatScenario: 'ransomware',
    firewallEnabled: true,
    tlsEnabled: true,
    zeroTrustEnabled: true,
    explodeFactor: 0,
    explanation:
      'Passing the outer firewall never grants blanket internal trust. Zero-Trust micro-segmentation blocks ransomware lateral spread and unauthorized SQLi pivots from reaching the Database Cluster.',
    keyTakeaway:
      'Perimeter defenses alone fail against lateral movement; Zero-Trust verifies every hop inside the data center.',
  },
];

export const PACKET_ANATOMY: PacketLayerBreakdown[] = [
  {
    layer: 'L2 · Ethernet Frame',
    headerName: 'IEEE 802.3 Data Link Header',
    plaintextFields: [
      { label: 'Src MAC', value: 'a4:83:e7:19:02:11' },
      { label: 'Dst MAC', value: '00:1b:44:11:3a:b7' },
      { label: 'EtherType', value: '0x0800 (IPv4)' },
    ],
  },
  {
    layer: 'L3 · IPv4 Packet',
    headerName: 'Internet Protocol Header',
    plaintextFields: [
      { label: 'Src IP', value: '192.168.10.42' },
      { label: 'Dst IP', value: '10.0.10.25' },
      { label: 'TTL / Proto', value: '63 · TCP (6)' },
    ],
  },
  {
    layer: 'L4 · TCP Segment',
    headerName: 'Transmission Control Header',
    plaintextFields: [
      { label: 'Src → Dst Port', value: '54312 → 443' },
      { label: 'Flags', value: 'ACK · PSH' },
      { label: 'Seq / Window', value: '2849102 · 64240' },
    ],
  },
  {
    layer: 'L6/L7 · Payload',
    headerName: 'TLS 1.3 Encrypted Application Data',
    plaintextFields: [
      { label: 'HTTP Method', value: 'POST /api/auth/token' },
      { label: 'Authorization', value: 'Bearer sk_live_98f4...c21a' },
    ],
    encryptedNote: '7f 9e 3c a1 44 b0 8d 12 e6 5a 91 0f c8 33 7b 2d (AES-256-GCM Ciphertext)',
  },
];
