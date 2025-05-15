'use client';

import { useState, useRef, useEffect } from 'react';
import Card from "@obsidian/ui/Card";
import Button from "@obsidian/ui/Button";
import { Plus, MessageSquare } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  area: string;
  isSelected: boolean;
}

export default function IntakeQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([
    // Brand Strategy
    { id: '1', text: 'Do you have defined brand guidelines (e.g. logo use, colors, tone of voice)?', area: 'Brand Strategy', isSelected: false },
    { id: '2', text: 'Have you clearly identified your brand\'s mission, vision, and values?', area: 'Brand Strategy', isSelected: false },
    { id: '3', text: 'Do you have a documented brand positioning statement?', area: 'Brand Strategy', isSelected: false },
    { id: '4', text: 'Do you know who your target audience is and what they care about?', area: 'Brand Strategy', isSelected: false },
    { id: '5', text: 'Have you developed a unique value proposition (UVP)?', area: 'Brand Strategy', isSelected: false },
    { id: '6', text: 'Do you consistently apply your brand voice across all channels?', area: 'Brand Strategy', isSelected: false },
    { id: '7', text: 'Do you regularly track brand awareness or perception in the market?', area: 'Brand Strategy', isSelected: false },

    // Martech
    { id: '8', text: 'Do you have a documented MarTech strategy that aligns with your marketing goals?', area: 'Martech', isSelected: false },
    { id: '9', text: 'Do you maintain a current inventory or map of all marketing tools and platforms used?', area: 'Martech', isSelected: false },
    { id: '10', text: 'Do you regularly assess whether your marketing tools are integrated and working together effectively?', area: 'Martech', isSelected: false },
    { id: '11', text: 'Is your CRM connected with your marketing automation and analytics platforms?', area: 'Martech', isSelected: false },
    { id: '12', text: 'Do you have a data governance process for collecting, storing, and using customer data?', area: 'Martech', isSelected: false },
    { id: '13', text: 'Do you evaluate the ROI of your marketing tools and platforms?', area: 'Martech', isSelected: false },
    { id: '14', text: 'Do you have a team or individual responsible for managing your MarTech stack?', area: 'Martech', isSelected: false },
    { id: '15', text: 'Do you use automation tools for campaigns, lead nurturing, or customer segmentation?', area: 'Martech', isSelected: false },
    { id: '16', text: 'Are your marketing tools scalable as your business grows?', area: 'Martech', isSelected: false },
    { id: '17', text: 'Do you have clear security and compliance standards for your marketing tools?', area: 'Martech', isSelected: false },

    // Data & Analytics
    { id: '18', text: 'Do you have a documented data and analytics strategy aligned with business goals?', area: 'Data & Analytics', isSelected: false },
    { id: '19', text: 'Do you know what key metrics or KPIs drive your business performance?', area: 'Data & Analytics', isSelected: false },
    { id: '20', text: 'Do you have a centralized system or data warehouse for collecting and storing data?', area: 'Data & Analytics', isSelected: false },
    { id: '21', text: 'Do your teams have access to real-time or regularly updated dashboards and reports?', area: 'Data & Analytics', isSelected: false },
    { id: '22', text: 'Do you have defined data governance policies?', area: 'Data & Analytics', isSelected: false },
    { id: '23', text: 'Is your customer data unified across platforms?', area: 'Data & Analytics', isSelected: false },
    { id: '24', text: 'Do you use analytics to guide business decisions and strategic planning?', area: 'Data & Analytics', isSelected: false },
    { id: '25', text: 'Do you use predictive or advanced analytics?', area: 'Data & Analytics', isSelected: false },
    { id: '26', text: 'Do you have dedicated data analysts or a data team supporting your organization?', area: 'Data & Analytics', isSelected: false },
    { id: '27', text: 'Do you regularly evaluate and improve your data tools and practices?', area: 'Data & Analytics', isSelected: false },

    // Performance Media
    { id: '28', text: 'Do you have specific performance marketing goals?', area: 'Performance Media', isSelected: false },
    { id: '29', text: 'Are you actively running measurable, paid marketing campaigns?', area: 'Performance Media', isSelected: false },
    { id: '30', text: 'Do you track performance marketing metrics in real time or near-real time?', area: 'Performance Media', isSelected: false },
    { id: '31', text: 'Do you use A/B testing or multivariate testing to optimize ad performance?', area: 'Performance Media', isSelected: false },
    { id: '32', text: 'Do you allocate your budget dynamically based on channel or campaign performance?', area: 'Performance Media', isSelected: false },
    { id: '33', text: 'Do you have defined customer acquisition costs (CAC) and lifetime value (LTV) targets?', area: 'Performance Media', isSelected: false },
    { id: '34', text: 'Are pixels and tracking tools correctly set up and maintained?', area: 'Performance Media', isSelected: false },
    { id: '35', text: 'Do you have clear attribution models to track which channels drive results?', area: 'Performance Media', isSelected: false },
    { id: '36', text: 'Do you regularly optimize creative and messaging based on performance data?', area: 'Performance Media', isSelected: false },
    { id: '37', text: 'Do you have internal or external resources dedicated to managing performance marketing?', area: 'Performance Media', isSelected: false },

    // Campaigns
    { id: '38', text: 'Do you have a documented process for planning and executing creative campaigns?', area: 'Campaigns', isSelected: false },
    { id: '39', text: 'Do your campaigns align with overall brand strategy and business objectives?', area: 'Campaigns', isSelected: false },
    { id: '40', text: 'Do you define campaign goals and success metrics before launching?', area: 'Campaigns', isSelected: false },
    { id: '41', text: 'Do you conduct audience research to inform your creative concepts and messaging?', area: 'Campaigns', isSelected: false },
    { id: '42', text: 'Do you develop creative concepts across multiple channels?', area: 'Campaigns', isSelected: false },
    { id: '43', text: 'Do you test and iterate creative elements based on performance data?', area: 'Campaigns', isSelected: false },
    { id: '44', text: 'Do you use a content calendar or campaign timeline for planning execution?', area: 'Campaigns', isSelected: false },
    { id: '45', text: 'Do you collaborate across departments when developing campaigns?', area: 'Campaigns', isSelected: false },
    { id: '46', text: 'Do you have a feedback loop or post-mortem process for evaluating creative effectiveness?', area: 'Campaigns', isSelected: false },
    { id: '47', text: 'Do you maintain a library or archive of past creative assets and results?', area: 'Campaigns', isSelected: false },

    // PR & Earned
    { id: '48', text: 'Do you have a strategy for gaining media coverage or third-party mentions?', area: 'PR & Earned', isSelected: false },
    { id: '49', text: 'Do you maintain relationships with journalists, editors, or media outlets?', area: 'PR & Earned', isSelected: false },
    { id: '50', text: 'Do you regularly pitch stories, press releases, or thought leadership to the media?', area: 'PR & Earned', isSelected: false },
    { id: '51', text: 'Do you have a process for monitoring earned media mentions and sentiment?', area: 'PR & Earned', isSelected: false },
    { id: '52', text: 'Do you measure the reach, engagement, or ROI of earned media placements?', area: 'PR & Earned', isSelected: false },
    { id: '53', text: 'Do you have a list of influencers, creators, or thought leaders relevant to your audience?', area: 'PR & Earned', isSelected: false },
    { id: '54', text: 'Do you collaborate with influencers or creators to promote your brand or products?', area: 'PR & Earned', isSelected: false },
    { id: '55', text: 'Do you provide influencers with creative guidelines, briefs, or messaging frameworks?', area: 'PR & Earned', isSelected: false },
    { id: '56', text: 'Do you track influencer performance?', area: 'PR & Earned', isSelected: false },
    { id: '57', text: 'Do you have tools or platforms in place for influencer discovery, management, or payments?', area: 'PR & Earned', isSelected: false },
    { id: '58', text: 'Do you encourage and amplify organic user-generated content (UGC)?', area: 'PR & Earned', isSelected: false },
    { id: '59', text: 'Do you have a process for vetting influencers for brand alignment and audience authenticity?', area: 'PR & Earned', isSelected: false },
    { id: '60', text: 'Do you integrate influencer and earned media into broader marketing campaigns?', area: 'PR & Earned', isSelected: false },
    { id: '61', text: 'Do you have a crisis or escalation plan in case of negative or controversial mentions?', area: 'PR & Earned', isSelected: false },

    // Website
    { id: '62', text: 'Do you have a documented strategy for your website tied to business goals?', area: 'Website', isSelected: false },
    { id: '63', text: 'Is your website regularly updated with fresh content?', area: 'Website', isSelected: false },
    { id: '64', text: 'Do you use clear calls to action (CTAs) aligned with user intent throughout the site?', area: 'Website', isSelected: false },
    { id: '65', text: 'Do you track website performance using analytics tools?', area: 'Website', isSelected: false },
    { id: '66', text: 'Is your site optimized for mobile and responsive across devices?', area: 'Website', isSelected: false },
    { id: '67', text: 'Do you run regular audits for SEO, page speed, and accessibility?', area: 'Website', isSelected: false },
    { id: '68', text: 'Is your site structured around clear user journeys and conversion paths?', area: 'Website', isSelected: false },
    { id: '69', text: 'Do you A/B test or optimize pages based on user behavior and performance?', area: 'Website', isSelected: false },
    { id: '70', text: 'Is your website integrated with your CRM, marketing automation, or e-commerce platforms?', area: 'Website', isSelected: false },
    { id: '71', text: 'Do you have clear ownership or a team responsible for website strategy, content, and performance?', area: 'Website', isSelected: false },

    // Digital Product
    { id: '72', text: 'Do you have a documented digital product strategy aligned with business goals and customer needs?', area: 'Digital Product', isSelected: false },
    { id: '73', text: 'Have you defined your product\'s value proposition and core use cases?', area: 'Digital Product', isSelected: false },
    { id: '74', text: 'Do you conduct user research or gather customer feedback to inform product decisions?', area: 'Digital Product', isSelected: false },
    { id: '75', text: 'Do you maintain a product roadmap that\'s reviewed and updated regularly?', area: 'Digital Product', isSelected: false },
    { id: '76', text: 'Do you have clear KPIs or success metrics for your product?', area: 'Digital Product', isSelected: false },
    { id: '77', text: 'Do you prioritize features or updates based on user impact and business value?', area: 'Digital Product', isSelected: false },
    { id: '78', text: 'Is your product team cross-functional?', area: 'Digital Product', isSelected: false },
    { id: '79', text: 'Do you use analytics or behavioral data to drive product decisions?', area: 'Digital Product', isSelected: false },
    { id: '80', text: 'Do you test or experiment with features before full rollout?', area: 'Digital Product', isSelected: false },
    { id: '81', text: 'Do you have a process for onboarding, educating, and retaining users?', area: 'Digital Product', isSelected: false },
    { id: '82', text: 'Is your product strategy integrated with marketing, sales, and customer success strategies?', area: 'Digital Product', isSelected: false },

    // Commerce
    { id: '83', text: 'Do you have a documented ecommerce strategy tied to revenue and growth goals?', area: 'Commerce', isSelected: false },
    { id: '84', text: 'Do you sell products or services directly through your website or an ecommerce platform?', area: 'Commerce', isSelected: false },
    { id: '85', text: 'Do you track and optimize key ecommerce metrics?', area: 'Commerce', isSelected: false },
    { id: '86', text: 'Do you have a defined customer journey from product discovery to checkout?', area: 'Commerce', isSelected: false },
    { id: '87', text: 'Is your product catalog optimized for SEO and search on your site?', area: 'Commerce', isSelected: false },
    { id: '88', text: 'Do you run targeted promotions, sales, or loyalty programs to drive repeat purchases?', area: 'Commerce', isSelected: false },
    { id: '89', text: 'Is your checkout experience optimized for speed, simplicity, and trust?', area: 'Commerce', isSelected: false },
    { id: '90', text: 'Do you use marketing automation for abandoned cart recovery, post-purchase emails, or personalized offers?', area: 'Commerce', isSelected: false },
    { id: '91', text: 'Are you actively testing and improving ecommerce performance with tools like heatmaps or A/B testing?', area: 'Commerce', isSelected: false },
    { id: '92', text: 'Do you integrate ecommerce data with your CRM, analytics, and fulfillment systems?', area: 'Commerce', isSelected: false },
    { id: '93', text: 'Do you sell on additional marketplaces as part of your strategy?', area: 'Commerce', isSelected: false },
    { id: '94', text: 'Do you have a plan for fulfillment, shipping logistics, and inventory management?', area: 'Commerce', isSelected: false },

    // CRM
    { id: '95', text: 'Do you have a documented CRM strategy aligned with customer lifecycle goals?', area: 'CRM', isSelected: false },
    { id: '96', text: 'Do you use a CRM platform to manage customer data and interactions?', area: 'CRM', isSelected: false },
    { id: '97', text: 'Is your CRM integrated with other key tools?', area: 'CRM', isSelected: false },
    { id: '98', text: 'Do you have defined stages or segments for managing leads, prospects, and customers?', area: 'CRM', isSelected: false },
    { id: '99', text: 'Do you personalize communications based on CRM data?', area: 'CRM', isSelected: false },
    { id: '100', text: 'Do you use CRM data to score leads or prioritize sales outreach?', area: 'CRM', isSelected: false },
    { id: '101', text: 'Is your sales, marketing, and customer service activity tracked within the CRM?', area: 'CRM', isSelected: false },
    { id: '102', text: 'Do you use automation within your CRM for tasks like follow-ups, onboarding, or re-engagement?', area: 'CRM', isSelected: false },
    { id: '103', text: 'Do you maintain data hygiene standards?', area: 'CRM', isSelected: false },
    { id: '104', text: 'Do you track and report on CRM-driven performance metrics?', area: 'CRM', isSelected: false },
    { id: '105', text: 'Do you have someone (or a team) responsible for managing and optimizing your CRM strategy?', area: 'CRM', isSelected: false },

    // App
    { id: '106', text: 'Do you have a documented strategy for improving app performance, UX, and engagement?', area: 'App', isSelected: false },
    { id: '107', text: 'Do you track key app metrics?', area: 'App', isSelected: false },
    { id: '108', text: 'Do you use analytics tools to monitor in-app behavior?', area: 'App', isSelected: false },
    { id: '109', text: 'Do you run A/B tests or experiments to optimize features, flows, or UX elements?', area: 'App', isSelected: false },
    { id: '110', text: 'Is your app regularly updated to improve performance, address bugs, or release new features?', area: 'App', isSelected: false },
    { id: '111', text: 'Do you gather and act on user feedback through reviews, surveys, or in-app prompts?', area: 'App', isSelected: false },
    { id: '112', text: 'Is your app store presence optimized?', area: 'App', isSelected: false },
    { id: '113', text: 'Do you use push notifications or in-app messaging strategically to drive engagement?', area: 'App', isSelected: false },
    { id: '114', text: 'Do you personalize the app experience based on user data or behavior?', area: 'App', isSelected: false },
    { id: '115', text: 'Do you have a roadmap or backlog that prioritizes optimization work based on user impact?', area: 'App', isSelected: false },
    { id: '116', text: 'Do you monitor crash reports, load times, and other technical performance metrics?', area: 'App', isSelected: false },

    // Organic Social
    { id: '117', text: 'Do you have a documented organic social media strategy aligned with business or brand goals?', area: 'Organic Social', isSelected: false },
    { id: '118', text: 'Do you maintain an active presence on platforms where your audience spends time?', area: 'Organic Social', isSelected: false },
    { id: '119', text: 'Do you use a content calendar to plan and schedule posts across channels?', area: 'Organic Social', isSelected: false },
    { id: '120', text: 'Do you create platform-specific content tailored to each channel\'s strengths and audience behavior?', area: 'Organic Social', isSelected: false },
    { id: '121', text: 'Do you track performance metrics?', area: 'Organic Social', isSelected: false },
    { id: '122', text: 'Do you engage with your community regularly?', area: 'Organic Social', isSelected: false },
    { id: '123', text: 'Do you use storytelling, behind-the-scenes, or UGC to build authentic brand presence?', area: 'Organic Social', isSelected: false },
    { id: '124', text: 'Do you collaborate with internal teams to inform social content?', area: 'Organic Social', isSelected: false },
    { id: '125', text: 'Do you analyze post and channel performance to inform future content decisions?', area: 'Organic Social', isSelected: false },
    { id: '126', text: 'Do you test different formats to optimize reach and engagement?', area: 'Organic Social', isSelected: false },
    { id: '127', text: 'Do you have clear brand guidelines for tone, visual style, and voice on social media?', area: 'Organic Social', isSelected: false }
  ]);

  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAddingCustomQuestion, setIsAddingCustomQuestion] = useState(false);
  const [newCustomQuestion, setNewCustomQuestion] = useState('');
  const [newCustomQuestionCategory, setNewCustomQuestionCategory] = useState('Other');

  const categories = ['All', ...Array.from(new Set(questions.map(q => q.area)))];

  const filteredQuestions = selectedCategory === 'All' 
    ? questions 
    : questions.filter(q => q.area === selectedCategory);

  // Add click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddCustomQuestion = () => {
    if (newCustomQuestion.trim()) {
      const question: Question = {
        id: Date.now().toString(),
        text: newCustomQuestion.trim(),
        area: newCustomQuestionCategory,
        isSelected: true
      };
      setSelectedQuestions([...selectedQuestions, question]);
      setNewCustomQuestion('');
      setNewCustomQuestionCategory('Other');
      setIsAddingCustomQuestion(false);
    }
  };

  const handleToggleQuestion = (question: Question) => {
    if (question.isSelected) {
      setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
      setQuestions(questions.map(q => 
        q.id === question.id ? { ...q, isSelected: false } : q
      ));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
      setQuestions(questions.filter(q => q.id !== question.id));
    }
  };

  const handleRemoveQuestion = (questionId: string) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, isSelected: false } : q
    ));
  };

  return (
    <div className="space-y-6">
      {/* Selected Questions Section */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Client Intake Questions</h2>
              <p className="text-sm text-gray-500 mt-1">
                These questions will be shown to clients in their portal
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingCustomQuestion(true)}
            >
              Add Custom Question
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {selectedQuestions.length === 0 && !isAddingCustomQuestion ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">Add questions to request here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedQuestions.map(question => (
                <div key={question.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{question.text}</p>
                    <p className="text-xs text-gray-500">{question.area}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveQuestion(question.id)}
                    className="ml-2"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {isAddingCustomQuestion && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newCustomQuestion}
                      onChange={(e) => setNewCustomQuestion(e.target.value)}
                      placeholder="Enter your custom question..."
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                    />
                    <select
                      value={newCustomQuestionCategory}
                      onChange={(e) => setNewCustomQuestionCategory(e.target.value)}
                      className="w-48 text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:border-primary focus:ring-primary"
                    >
                      {categories.filter(cat => cat !== 'All').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingCustomQuestion(false);
                        setNewCustomQuestion('');
                        setNewCustomQuestionCategory('Other');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddCustomQuestion}
                      disabled={!newCustomQuestion.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Template Questions Section */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Template Questions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select questions to add to the client intake
              </p>
            </div>
            <div ref={dropdownRef} className="relative inline-block w-48">
              <div 
                className="flex items-center justify-between p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedCategory}
                  </p>
                </div>
                <div className="ml-2">
                  <svg
                    className={`h-5 w-5 text-gray-500 transform transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg">
                  <div className="py-1">
                    {categories.map((category) => (
                      <button
                        key={category}
                        className={`flex items-center w-full px-4 py-2 text-sm text-left ${
                          selectedCategory === category 
                            ? 'bg-gray-100 text-primary' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="truncate">{category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-2">
            {filteredQuestions.map(question => (
              <div key={question.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{question.text}</p>
                  <p className="text-xs text-gray-500">{question.area}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleQuestion(question)}
                  className="w-8 h-8 p-0 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
} 