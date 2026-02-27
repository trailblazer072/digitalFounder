import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
}

export default function SEO({ title, description }: SEOProps) {
    const appName = "FlowSync"; // Or DigitalFounder, using the brand name apparent in the code
    const fullTitle = `${title} | ${appName}`;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description || "Accelerate your workflow with AI-powered async engineering."} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || "Accelerate your workflow with AI-powered async engineering."} />
            <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
    );
}
