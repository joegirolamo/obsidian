import { QuestionType } from './types';

// Template intake questions for each category
// You can edit or expand this list as needed

export const categories = [
  'All',
  'Brand Strategy',
  'Martech',
  'Data & Analytics',
  'Performance Media',
  'Campaigns',
  'PR & Earned',
  'Website',
  'Digital Product',
  'Commerce',
  'CRM',
  'App',
  'Organic Social',
  'Other'
] as const;

export const templateQuestions: Array<{
  question: string;
  type: QuestionType;
  options: string[];
  area: string;
}> = [
  // Brand Strategy
  {
    question: 'Do you have defined brand guidelines (e.g. logo use, colors, tone of voice)?',
    type: 'BOOLEAN',
    options: [],
    area: 'Brand Strategy'
  },
  {
    question: 'Have you clearly identified your brand\'s mission, vision, and values?',
    type: 'BOOLEAN',
    options: [],
    area: 'Brand Strategy'
  },
  {
    question: 'Do you have a documented brand positioning statement?',
    type: 'BOOLEAN',
    options: [],
    area: 'Brand Strategy'
  },
  {
    question: 'Do you know who your target audience is and what they care about?',
    type: 'BOOLEAN',
    options: [],
    area: 'Brand Strategy'
  },
  {
    question: 'Have you developed a unique value proposition (UVP)?',
    type: 'BOOLEAN',
    options: [],
    area: 'Brand Strategy'
  },
  {
    question: 'Do you consistently apply your brand voice across all channels?',
    type: 'BOOLEAN',
    options: [],
    area: 'Brand Strategy'
  },
  {
    question: 'Do you regularly track brand awareness or perception in the market?',
    type: 'BOOLEAN',
    options: [],
    area: 'Brand Strategy'
  },

  // Martech
  {
    question: 'Do you have a documented MarTech strategy that aligns with your marketing goals?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },
  {
    question: 'Do you maintain a current inventory or map of all marketing tools and platforms used?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },
  {
    question: 'Do you regularly assess whether your marketing tools are integrated and working together effectively?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },
  {
    question: 'Is your CRM connected with your marketing automation and analytics platforms?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },
  {
    question: 'Do you have a data governance process for collecting, storing, and using customer data?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },
  {
    question: 'Do you evaluate the ROI of your marketing tools and platforms?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },
  {
    question: 'Do you have a team or individual responsible for managing your MarTech stack?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },
  {
    question: 'Do you use automation tools for campaigns, lead nurturing, or customer segmentation?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },
  {
    question: 'Are your marketing tools scalable as your business grows?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },
  {
    question: 'Do you have clear security and compliance standards for your marketing tools?',
    type: 'BOOLEAN',
    options: [],
    area: 'Martech'
  },

  // Data & Analytics
  {
    question: 'Do you have a documented data and analytics strategy aligned with business goals?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },
  {
    question: 'Do you know what key metrics or KPIs drive your business performance?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },
  {
    question: 'Do you have a centralized system or data warehouse for collecting and storing data?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },
  {
    question: 'Do your teams have access to real-time or regularly updated dashboards and reports?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },
  {
    question: 'Do you have defined data governance policies?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },
  {
    question: 'Is your customer data unified across platforms?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },
  {
    question: 'Do you use analytics to guide business decisions and strategic planning?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },
  {
    question: 'Do you use predictive or advanced analytics?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },
  {
    question: 'Do you have dedicated data analysts or a data team supporting your organization?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },
  {
    question: 'Do you regularly evaluate and improve your data tools and practices?',
    type: 'BOOLEAN',
    options: [],
    area: 'Data & Analytics'
  },

  // Performance Media
  {
    question: 'Do you have specific performance marketing goals?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },
  {
    question: 'Are you actively running measurable, paid marketing campaigns?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },
  {
    question: 'Do you track performance marketing metrics in real time or near-real time?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },
  {
    question: 'Do you use A/B testing or multivariate testing to optimize ad performance?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },
  {
    question: 'Do you allocate your budget dynamically based on channel or campaign performance?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },
  {
    question: 'Do you have defined customer acquisition costs (CAC) and lifetime value (LTV) targets?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },
  {
    question: 'Are pixels and tracking tools correctly set up and maintained?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },
  {
    question: 'Do you have clear attribution models to track which channels drive results?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },
  {
    question: 'Do you regularly optimize creative and messaging based on performance data?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },
  {
    question: 'Do you have internal or external resources dedicated to managing performance marketing?',
    type: 'BOOLEAN',
    options: [],
    area: 'Performance Media'
  },

  // Campaigns
  {
    question: 'Do you have a documented process for planning and executing creative campaigns?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },
  {
    question: 'Do your campaigns align with overall brand strategy and business objectives?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },
  {
    question: 'Do you define campaign goals and success metrics before launching?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },
  {
    question: 'Do you conduct audience research to inform your creative concepts and messaging?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },
  {
    question: 'Do you develop creative concepts across multiple channels?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },
  {
    question: 'Do you test and iterate creative elements based on performance data?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },
  {
    question: 'Do you use a content calendar or campaign timeline for planning execution?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },
  {
    question: 'Do you collaborate across departments when developing campaigns?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },
  {
    question: 'Do you have a feedback loop or post-mortem process for evaluating creative effectiveness?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },
  {
    question: 'Do you maintain a library or archive of past creative assets and results?',
    type: 'BOOLEAN',
    options: [],
    area: 'Campaigns'
  },

  // PR & Earned
  {
    question: 'Do you have a strategy for gaining media coverage or third-party mentions?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you maintain relationships with journalists, editors, or media outlets?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you regularly pitch stories, press releases, or thought leadership to the media?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you have a process for monitoring earned media mentions and sentiment?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you measure the reach, engagement, or ROI of earned media placements?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you have a list of influencers, creators, or thought leaders relevant to your audience?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you collaborate with influencers or creators to promote your brand or products?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you provide influencers with creative guidelines, briefs, or messaging frameworks?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you track influencer performance?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you have tools or platforms in place for influencer discovery, management, or payments?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you encourage and amplify organic user-generated content (UGC)?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you have a process for vetting influencers for brand alignment and audience authenticity?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you integrate influencer and earned media into broader marketing campaigns?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },
  {
    question: 'Do you have a crisis or escalation plan in case of negative or controversial mentions?',
    type: 'BOOLEAN',
    options: [],
    area: 'PR & Earned'
  },

  // Website
  {
    question: 'Do you have a documented strategy for your website tied to business goals?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },
  {
    question: 'Is your website regularly updated with fresh content?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },
  {
    question: 'Do you use clear calls to action (CTAs) aligned with user intent throughout the site?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },
  {
    question: 'Do you track website performance using analytics tools?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },
  {
    question: 'Is your site optimized for mobile and responsive across devices?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },
  {
    question: 'Do you run regular audits for SEO, page speed, and accessibility?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },
  {
    question: 'Is your site structured around clear user journeys and conversion paths?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },
  {
    question: 'Do you A/B test or optimize pages based on user behavior and performance?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },
  {
    question: 'Is your website integrated with your CRM, marketing automation, or e-commerce platforms?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },
  {
    question: 'Do you have clear ownership or a team responsible for website strategy, content, and performance?',
    type: 'BOOLEAN',
    options: [],
    area: 'Website'
  },

  // Digital Product
  {
    question: 'Do you have a documented digital product strategy aligned with business goals and customer needs?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Have you defined your product\'s value proposition and core use cases?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Do you conduct user research or gather customer feedback to inform product decisions?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Do you maintain a product roadmap that\'s reviewed and updated regularly?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Do you have clear KPIs or success metrics for your product?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Do you prioritize features or updates based on user impact and business value?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Is your product team cross-functional?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Do you use analytics or behavioral data to drive product decisions?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Do you test or experiment with features before full rollout?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Do you have a process for onboarding, educating, and retaining users?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },
  {
    question: 'Is your product strategy integrated with marketing, sales, and customer success strategies?',
    type: 'BOOLEAN',
    options: [],
    area: 'Digital Product'
  },

  // Commerce
  {
    question: 'Do you have a documented ecommerce strategy tied to revenue and growth goals?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Do you sell products or services directly through your website or an ecommerce platform?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Do you track and optimize key ecommerce metrics?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Do you have a defined customer journey from product discovery to checkout?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Is your product catalog optimized for SEO and search on your site?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Do you run targeted promotions, sales, or loyalty programs to drive repeat purchases?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Is your checkout experience optimized for speed, simplicity, and trust?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Do you use marketing automation for abandoned cart recovery, post-purchase emails, or personalized offers?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Are you actively testing and improving ecommerce performance with tools like heatmaps or A/B testing?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Do you integrate ecommerce data with your CRM, analytics, and fulfillment systems?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Do you sell on additional marketplaces as part of your strategy?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },
  {
    question: 'Do you have a plan for fulfillment, shipping logistics, and inventory management?',
    type: 'BOOLEAN',
    options: [],
    area: 'Commerce'
  },

  // CRM
  {
    question: 'Do you have a documented CRM strategy aligned with customer lifecycle goals?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Do you use a CRM platform to manage customer data and interactions?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Is your CRM integrated with other key tools?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Do you have defined stages or segments for managing leads, prospects, and customers?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Do you personalize communications based on CRM data?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Do you use CRM data to score leads or prioritize sales outreach?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Is your sales, marketing, and customer service activity tracked within the CRM?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Do you use automation within your CRM for tasks like follow-ups, onboarding, or re-engagement?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Do you maintain data hygiene standards?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Do you track and report on CRM-driven performance metrics?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },
  {
    question: 'Do you have someone (or a team) responsible for managing and optimizing your CRM strategy?',
    type: 'BOOLEAN',
    options: [],
    area: 'CRM'
  },

  // App
  {
    question: 'Do you have a documented strategy for improving app performance, UX, and engagement?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Do you track key app metrics?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Do you use analytics tools to monitor in-app behavior?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Do you run A/B tests or experiments to optimize features, flows, or UX elements?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Is your app regularly updated to improve performance, address bugs, or release new features?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Do you gather and act on user feedback through reviews, surveys, or in-app prompts?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Is your app store presence optimized?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Do you use push notifications or in-app messaging strategically to drive engagement?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Do you personalize the app experience based on user data or behavior?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Do you have a roadmap or backlog that prioritizes optimization work based on user impact?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },
  {
    question: 'Do you monitor crash reports, load times, and other technical performance metrics?',
    type: 'BOOLEAN',
    options: [],
    area: 'App'
  },

  // Organic Social
  {
    question: 'Do you have a documented organic social media strategy aligned with business or brand goals?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you maintain an active presence on platforms where your audience spends time?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you use a content calendar to plan and schedule posts across channels?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you create platform-specific content tailored to each channel\'s strengths and audience behavior?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you track performance metrics?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you engage with your community regularly?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you use storytelling, behind-the-scenes, or UGC to build authentic brand presence?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you collaborate with internal teams to inform social content?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you analyze post and channel performance to inform future content decisions?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you test different formats to optimize reach and engagement?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  },
  {
    question: 'Do you have clear brand guidelines for tone, visual style, and voice on social media?',
    type: 'BOOLEAN',
    options: [],
    area: 'Organic Social'
  }
]; 