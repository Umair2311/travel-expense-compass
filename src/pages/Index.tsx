
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTravel } from '@/context/TravelContext';
import { format } from 'date-fns';
import { PlusCircle, Users, ReceiptText, PiggyBank, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';

const Index = () => {
  const { currentTravel, travels, setCurrentTravel } = useTravel();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If there are no travels and we're on the home page, redirect to new travel page
    if (travels.length === 0) {
      navigate('/new-travel');
    }
  }, [travels, navigate]);
  
  // Handle travel selection
  const handleTravelSelect = (travelId: string) => {
    const travel = travels.find(t => t.id === travelId);
    if (travel) {
      setCurrentTravel(travel);
    }
  };
  
  // If no current travel is selected but there are travels, show travel selection
  if (!currentTravel && travels.length > 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome to Travel Expense Splitter</h1>
            <p className="text-muted-foreground">Select an existing travel or create a new one</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {travels.map(travel => (
              <Card key={travel.id} className="overflow-hidden">
                <CardHeader className="travel-gradient text-white">
                  <CardTitle>{travel.name}</CardTitle>
                  <CardDescription className="text-white/80">
                    {format(new Date(travel.startDate), 'MMM d')} - {format(new Date(travel.endDate), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{travel.participants.length} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{travel.expenses.length} expenses</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50">
                  <Button 
                    className="w-full" 
                    onClick={() => handleTravelSelect(travel.id)}
                  >
                    Open Travel
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            <Card className="border-dashed">
              <CardContent className="h-full flex items-center justify-center p-6">
                <Button 
                  variant="outline" 
                  className="h-full w-full py-8 flex flex-col gap-4"
                  onClick={() => navigate('/new-travel')}
                >
                  <PlusCircle className="h-12 w-12" />
                  <span className="text-lg font-medium">Create New Travel</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  // If current travel is selected, show dashboard
  if (currentTravel) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{currentTravel.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(currentTravel.startDate), 'MMM d')} - {format(new Date(currentTravel.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {currentTravel?.participants?.length || 0}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate('/participants')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Participants
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${currentTravel?.expenses?.reduce((sum, e) => sum + e.amount, 0).toFixed(2) || "0.00"}
                </div>
                <div className="text-muted-foreground text-sm">
                  {currentTravel?.expenses?.length || 0} expense entries
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate('/expenses')}
                >
                  <ReceiptText className="mr-2 h-4 w-4" />
                  View Expenses
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Travel Fund</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${currentTravel?.advanceContributions?.reduce((sum, c) => sum + c.amount, 0).toFixed(2) || "0.00"}
                </div>
                <div className="text-muted-foreground text-sm">
                  {currentTravel?.advanceContributions?.length || 0} contributions
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate('/fund')}
                >
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Manage Fund
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {!currentTravel?.expenses || currentTravel.expenses.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No expenses recorded yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentTravel.expenses
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map(expense => (
                        <div key={expense.id} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {expense.type}{expense.customType ? `: ${expense.customType}` : ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(expense.date), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="font-medium">${expense.amount.toFixed(2)}</div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/expenses')}
                >
                  View All Expenses
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                {!currentTravel?.advanceContributions || currentTravel.advanceContributions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No contributions recorded yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentTravel.advanceContributions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map(contribution => {
                        const participant = currentTravel.participants.find(p => p.id === contribution.participantId);
                        return (
                          <div key={contribution.id} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{participant?.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(contribution.date), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <div className="font-medium">${contribution.amount.toFixed(2)}</div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/fund')}
                >
                  View All Contributions
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Fallback
  return null;
};

export default Index;
