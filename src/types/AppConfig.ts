export interface BrandingConfig {
    appName: string;
    companyName: string;
    logo: {
        main: string;
        auth: string;
        favicon: string;
        poweredBy?: string;
        // Optional cyan-on-dark variant of poweredBy; falls back to poweredBy when a
        // deployment only ships one asset.
        poweredByDark?: string;
        logoEIU?: string;
    };

    colors: {
        primary: string;
        secondary?: string;
    };

    footer?: {
        copyright: string;
        poweredBy?: string;
    };
}
