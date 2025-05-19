import { useEffect, useState } from 'react';
import { Menu, X, Brain } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Define a simple Logo component
const Logo = () => (
  <Link href="/" className="text-xl font-bold text-gray-900">
    Obsidian
  </Link>
);

// Define navigation links
const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/scorecard', label: 'Scorecard' },
  { href: '/admin/opportunities', label: 'Opportunities' },
  { href: '/admin/tools', label: 'Tools' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBrainViewer, setShowBrainViewer] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="-ml-2 mr-2 flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="flex-shrink-0 flex items-center">
              <Logo />
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {/* Nav Links */}
              {navLinks.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} />
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {/* Add Brain Viewer Button */}
            <button
              onClick={() => setShowBrainViewer(true)}
              className="ml-4 flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Brain size={16} className="mr-1.5" />
              View Brain
            </button>
            {/* Existing user menu or other actions */}
            {/* ... */}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <MobileNavLink 
                key={link.href} 
                href={link.href} 
                label={link.label} 
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Brain Viewer Modal */}
      {showBrainViewer && (
        <BrainViewer onClose={() => setShowBrainViewer(false)} />
      )}
    </nav>
  );
}

// NavLink component
function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);
  
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
        isActive
          ? 'border-blue-500 text-gray-900'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {label}
    </Link>
  );
}

// Mobile NavLink component
function MobileNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);
  
  return (
    <Link
      href={href}
      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
        isActive
          ? 'bg-blue-50 border-blue-500 text-blue-700'
          : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {label}
    </Link>
  );
}

// Add this to your component or extract to a separate file
function BrainViewer({ onClose }: { onClose: () => void }) {
  const [brainData, setBrainData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get the businessId from the URL or context
  const pathname = usePathname();
  const businessId = pathname?.includes('/portal/') 
    ? pathname.split('/portal/')[1]?.split('/')[0] 
    : null;
  
  useEffect(() => {
    async function fetchBrainData() {
      if (!businessId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/brain?businessId=${businessId}`);
        if (response.ok) {
          const data = await response.json();
          setBrainData(data);
        } else {
          console.error('Failed to fetch brain data');
        }
      } catch (error) {
        console.error('Error fetching brain data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBrainData();
  }, [businessId]);
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">Client Brain Data</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : brainData ? (
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(brainData, null, 2)}
            </pre>
          ) : (
            <div className="text-center text-gray-500 py-8">
              {businessId ? 'No brain data available' : 'Please navigate to a client portal to view brain data'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 