import React, { useState } from 'react';
import { Shield, Lock, Eye, Server, Globe, Zap, CheckCircle, AlertTriangle, Layers, Monitor } from 'lucide-react';
import styles from '../styles/pages/SecurityPage.module.css';

const SecurityPage = () => {
    const [activeSection, setActiveSection] = useState('overview');

    const securityLayers = [
        {
            id: 'cloud',
            title: 'Cloud-Level Protection',
            subtitle: 'DigitalOcean Cloud Firewall',
            icon: Globe,
            description: 'First line of defense at the infrastructure level',
            features: [
                'Network-level traffic filtering',
                'DDoS attack prevention',
                'Infrastructure-level blocking',
                'Resource consumption protection'
            ],
            colorClass: 'blue'
        },
        {
            id: 'os',
            title: 'Operating System Firewall',
            subtitle: 'UFW - Uncomplicated Firewall',
            icon: Server,
            description: 'Server-level access control and port management',
            features: [
                'Default deny all incoming traffic',
                'Essential services only (SSH, HTTP, HTTPS)',
                'Minimized attack surface',
                'Granular port control'
            ],
            colorClass: 'green'
        },
        {
            id: 'threat',
            title: 'Intelligent Threat Detection',
            subtitle: 'Fail2Ban Intrusion Prevention',
            icon: Eye,
            description: 'Real-time monitoring and automated threat response',
            features: [
                'Brute force attack detection',
                'Vulnerability scan blocking',
                'Automated IP banning',
                'Pattern learning and adaptation'
            ],
            colorClass: 'orange'
        },
        {
            id: 'app',
            title: 'Application-Level Security',
            subtitle: 'Nginx Security Rules',
            icon: Shield,
            description: 'Web application-specific protection and filtering',
            features: [
                'Rate limiting protection',
                'Malicious path blocking',
                'Attack pattern recognition',
                'Request validation'
            ],
            colorClass: 'purple'
        }
    ];

    const complianceFeatures = [
        {
            title: 'HTTPS Encryption',
            description: 'Industry-standard SSL/TLS encryption for all data transmission',
            icon: Lock
        },
        {
            title: 'Real-Time Monitoring',
            description: '24/7 surveillance of all access attempts and system activity',
            icon: Monitor
        },
        {
            title: 'Automated Updates',
            description: 'Critical security patches applied automatically to ensure latest protection',
            icon: Zap
        },
        {
            title: 'Audit Logging',
            description: 'Complete audit trail of all system access and security events',
            icon: CheckCircle
        }
    ];

    const SecurityLayer = ({ layer, index }) => {
        const Icon = layer.icon;
        return (
            <div className={styles.securityCard}>
                <div className={styles.cardHeader}>
                    <div className={`${styles.iconContainer} ${styles[layer.colorClass]}`}>
                        <Icon className={styles.icon} />
                    </div>
                    <div className={styles.headerText}>
                        <h3 className={styles.cardTitle}>{layer.title}</h3>
                        <p className={styles.cardSubtitle}>{layer.subtitle}</p>
                    </div>
                </div>

                <p className={styles.cardDescription}>{layer.description}</p>

                <ul className={styles.featureList}>
                    {layer.features.map((feature, idx) => (
                        <li key={idx} className={styles.featureItem}>
                            <CheckCircle className={styles.checkIcon} />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const FeatureCard = ({ feature }) => {
        const Icon = feature.icon;
        return (
            <div className={styles.featureCard}>
                <div className={styles.featureHeader}>
                    <div className={styles.featureIconContainer}>
                        <Icon className={styles.featureIcon} />
                    </div>
                    <h4 className={styles.featureTitle}>{feature.title}</h4>
                </div>
                <p className={styles.featureDescription}>{feature.description}</p>
            </div>
        );
    };

    return (
        <div className={styles.securityPage}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.heroContent}>
                        <div className={styles.heroIcon}>
                            <Shield className={styles.heroIconSvg} />
                        </div>
                        <h1 className={styles.heroTitle}>
                            Enterprise-Grade Security Framework
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Protecting sensitive CPA compliance data with military-grade security for New Hampshire accounting professionals
                        </p>
                        <div className={styles.heroBadges}>
                            <span className={styles.badge}>
                                <Lock className={styles.badgeIcon} />
                                SSL/TLS Encrypted
                            </span>
                            <span className={styles.badge}>
                                <Eye className={styles.badgeIcon} />
                                24/7 Monitoring
                            </span>
                            <span className={styles.badge}>
                                <Layers className={styles.badgeIcon} />
                                Multi-Layer Defense
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Multi-Layer Security Section */}
            <div className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            Multi-Layer Security Architecture
                        </h2>
                        <p className={styles.sectionSubtitle}>
                            Four independent security layers work together to provide comprehensive protection against all types of cyber threats
                        </p>
                    </div>

                    <div className={styles.layersGrid}>
                        {securityLayers.map((layer, index) => (
                            <SecurityLayer key={layer.id} layer={layer} index={index} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Security Flow Visualization */}
            <div className={styles.flowSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>How Your Data Stays Protected</h2>
                        <p className={styles.sectionSubtitle}>Every request passes through multiple security checkpoints</p>
                    </div>

                    <div className={styles.flowContainer}>
                        {securityLayers.map((layer, index) => (
                            <React.Fragment key={layer.id}>
                                <div className={styles.flowStep}>
                                    <div className={`${styles.flowIcon} ${styles[layer.colorClass]}`}>
                                        <layer.icon className={styles.flowIconSvg} />
                                    </div>
                                    <p className={styles.flowLabel}>
                                        {layer.title.split(' ').slice(0, 2).join(' ')}
                                    </p>
                                </div>
                                {index < securityLayers.length - 1 && (
                                    <div className={styles.flowArrow}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Compliance Features */}
            <div className={styles.complianceSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Industry Standards & Compliance</h2>
                        <p className={styles.sectionSubtitle}>Meeting and exceeding current web security standards</p>
                    </div>

                    <div className={styles.complianceGrid}>
                        {complianceFeatures.map((feature, index) => (
                            <FeatureCard key={index} feature={feature} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Data Protection Section */}
            <div className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.dataProtectionContent}>
                        <div className={styles.dataProtectionText}>
                            <h2 className={styles.sectionTitle}>Your Data Protection Guarantee</h2>
                            <div className={styles.guaranteeList}>
                                <div className={styles.guaranteeItem}>
                                    <CheckCircle className={styles.guaranteeIcon} />
                                    <div>
                                        <h4>End-to-End Encryption</h4>
                                        <p>All data encrypted during transmission and at rest using AES-256 encryption</p>
                                    </div>
                                </div>
                                <div className={styles.guaranteeItem}>
                                    <CheckCircle className={styles.guaranteeIcon} />
                                    <div>
                                        <h4>Zero-Knowledge Architecture</h4>
                                        <p>Your sensitive data remains private and inaccessible to unauthorized parties</p>
                                    </div>
                                </div>
                                <div className={styles.guaranteeItem}>
                                    <CheckCircle className={styles.guaranteeIcon} />
                                    <div>
                                        <h4>Continuous Security Monitoring</h4>
                                        <p>24/7 automated threat detection and response systems</p>
                                    </div>
                                </div>
                                <div className={styles.guaranteeItem}>
                                    <CheckCircle className={styles.guaranteeIcon} />
                                    <div>
                                        <h4>Regular Security Audits</h4>
                                        <p>Independent security assessments and penetration testing</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.dataProtectionVisual}>
                            <div className={styles.shieldVisual}>
                                <Shield className={styles.shieldIcon} />
                                <div className={styles.shieldRings}>
                                    <div className={styles.ring}></div>
                                    <div className={styles.ring}></div>
                                    <div className={styles.ring}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust Section */}
            <div className={styles.trustSection}>
                <div className={styles.container}>
                    <div className={styles.trustContent}>
                        <h2 className={styles.trustTitle}>Trusted by New Hampshire CPAs</h2>
                        <p className={styles.trustSubtitle}>
                            Our security framework demonstrates SuperCPE's unwavering commitment to protecting the sensitive professional information of New Hampshire's accounting community.
                        </p>
                        <div className={styles.trustStats}>
                            <div className={styles.trustStat}>
                                <div className={styles.statNumber}>99.9%</div>
                                <div className={styles.statLabel}>Uptime Guarantee</div>
                            </div>
                            <div className={styles.trustStat}>
                                <div className={styles.statNumber}>0</div>
                                <div className={styles.statLabel}>Security Breaches</div>
                            </div>
                            <div className={styles.trustStat}>
                                <div className={styles.statNumber}>24/7</div>
                                <div className={styles.statLabel}>Security Monitoring</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityPage;