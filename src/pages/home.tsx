import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Film, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-5">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            What are you in the mood for?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose films or TV series to get personalized recommendations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Link to="/films">
            <Card className="p-10 hover:border-primary/50 transition-all duration-300 cursor-pointer group shadow-md hover:shadow-xl hover:-translate-y-1 bg-card">
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <Film className="w-10 h-10 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-3 group-hover:text-accent transition-colors">
                    Films
                  </h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Explore personalized film recommendations curated just for you
                  </p>
                </div>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm">
                  Browse Films
                </Button>
              </div>
            </Card>
          </Link>

          <Link to="/series">
            <Card className="p-10 hover:border-primary/50 transition-all duration-300 cursor-pointer group shadow-md hover:shadow-xl hover:-translate-y-1 bg-card">
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <Tv className="w-10 h-10 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-3 group-hover:text-accent transition-colors">
                    TV Series
                  </h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Discover your next binge-worthy series with tailored suggestions
                  </p>
                </div>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm">
                  Browse Series
                </Button>
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-12 text-center pt-12 border-t border-border">
          <div className="space-y-2">
            <p className="text-4xl font-bold text-accent">0</p>
            <p className="text-sm text-muted-foreground font-medium">Films Watched</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold text-accent">0</p>
            <p className="text-sm text-muted-foreground font-medium">Series Watched</p>
          </div>
        </div>
      </div>
    </div>
  );
}
