
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useTravel } from '@/context/TravelContext';
import Layout from '@/components/Layout';
import { DateRange } from '@/types/models';
import { cn } from '@/lib/utils';

const NewTravel = () => {
  const navigate = useNavigate();
  const { createTravel } = useTravel();
  const [name, setName] = useState('');
  const [date, setDate] = useState<DateRange>({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!name.trim()) {
      setNameError('Please enter a travel name');
      return;
    }
    
    setIsLoading(true);
    
    // Create travel
    createTravel(name, date);
    
    setIsLoading(false);
    navigate('/');
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Travel</CardTitle>
            <CardDescription>
              Start by giving your trip a name and selecting the dates
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Travel Name</Label>
                <Input
                  id="name"
                  placeholder="Summer Vacation"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError('');
                  }}
                  className={nameError ? 'border-red-500' : ''}
                />
                {nameError && (
                  <p className="text-sm text-red-500">{nameError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Travel Dates</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.startDate ? (
                        date.endDate ? (
                          <>
                            {format(date.startDate, "LLL dd, y")} -{" "}
                            {format(date.endDate, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.startDate, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date.startDate}
                      selected={{
                        from: date.startDate,
                        to: date.endDate,
                      }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDate({
                            startDate: range.from,
                            endDate: range.to,
                          });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Travel'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default NewTravel;
