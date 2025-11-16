import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/discover" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Discover
                </Link>
              </li>
              <li>
                <Link 
                  to="/showcase" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Showcase
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/help" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Terms
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-smooth"
                >
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:support@showcase.com" className="hover:text-foreground transition-smooth">
                  support@showcase.com
                </a>
              </li>
              <li>
                <a href="tel:+1234567890" className="hover:text-foreground transition-smooth">
                  (123) 456-7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ShowCase. All rights reserved.
          </p>
          <p className="text-xs opacity-70 text-muted-foreground">
            Some pages include ads or affiliate links. Featured listings are paid and clearly labeled.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
