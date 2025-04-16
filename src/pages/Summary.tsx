import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravel } from '@/context/TravelContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileSpreadsheet, 
  PiggyBank, 
  Wallet, 
  User, 
  CircleDollarSign, 
  ArrowDownUp, 
  ArrowDown, 
  ArrowUp,
  Gift,
  DollarSign,
  Medal,
  AlertTriangle
} from 'lucide-react';
import { Settlement } from '@/types/models';

const Summary = () => {
  const { 
    currentTravel, 
    calculateSettlements, 
    getTotalExpenses, 
    markRefundAsDonated, 
    exportToExcel 
  } = useTravel();
  const navigate = useNavigate();
  
  const [sortBy, setSortBy] = useState<keyof Settlement>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  useEffect(() => {
    if (currentTravel) {
      console.log("Loading Summary data for travel:", currentTravel);
      const calculatedSettlements = calculateSettlements();
      console.log("Calculated settlements:", calculatedSettlements);
      setSettlements(calculatedSettlements);
      
      const expensesTotal = getTotalExpenses();
      console.log("Total expenses:", expensesTotal);
      setTotalExpenses(expensesTotal);
    }
  }, [currentTravel, calculateSettlements, getTotalExpenses]);
  
  useEffect(() => {
    if (!currentTravel) {
      console.log("No current travel, redirecting to home");
      navigate('/');
    }
  }, [currentTravel, navigate]);
  
  if (!currentTravel) {
    return null;
  }
  
  const totalDue = settlements.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
  const totalRefund = settlements.reduce((sum, s) => sum + (s.refundAmount || 0), 0);
  const totalDonated = settlements.reduce((sum, s) => s.donated ? sum + (s.refundAmount || 0) : sum, 0);
  
  const displayTotalExpenses = isNaN(totalExpenses) ? 0 : totalExpenses;
  const displayTotalDue = isNaN(totalDue) ? 0 : totalDue;
  const displayTotalRefund = isNaN(totalRefund - totalDonated) ? 0 : (totalRefund - totalDonated);
  
  console.log("Display values:", {
    expenses: displayTotalExpenses,
    due: displayTotalDue,
    refund: displayTotalRefund
  });
  
  const sortedSettlements = [...settlements].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc'
        ? (a.name || '').localeCompare(b.name || '')
        : (b.name || '').localeCompare(a.name || '');
    } else {
      const valA = a[sortBy] as number || 0;
      const valB = b[sortBy] as number || 0;
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }
  });
  
  const handleSort = (field: keyof Settlement) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  const handleDonationToggle = (participantId: string, donated: boolean) => {
    markRefundAsDonated(participantId, donated);
    const updatedSettlements = calculateSettlements();
    setSettlements(updatedSettlements);
  };
  
  const highestContributor = settlements.length > 0 ? 
    [...settlements].sort((a, b) => 
      ((b.advancePaid || 0) + (b.personallyPaid || 0)) - ((a.advancePaid || 0) + (a.personallyPaid || 0))
    )[0] : null;
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Summary</h1>
            <p className="text-muted-foreground">
              Final expense calculation and settlement
            </p>
          </div>
          <Button onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${displayTotalExpenses.toFixed(2)}
              </div>
              <div className="text-muted-foreground text-sm">
                All travel expenses
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-1">
                <ArrowDown className="h-4 w-4 text-travel-error" /> Due Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${displayTotalDue.toFixed(2)}
              </div>
              <div className="text-muted-foreground text-sm">
                To be collected
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-1">
                <ArrowUp className="h-4 w-4 text-travel-secondary" /> Refunds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${displayTotalRefund.toFixed(2)}
              </div>
              <div className="text-muted-foreground text-sm">
                To be returned
              </div>
            </CardContent>
          </Card>
        </div>
        
        {highestContributor && (highestContributor.advancePaid || 0) + (highestContributor.personallyPaid || 0) > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-travel-primary/10 to-travel-secondary/10">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-yellow-500 text-white p-2 rounded-full">
                <Medal className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{highestContributor.name} contributed the most</p>
                <p className="text-sm text-muted-foreground">
                  With a total of ${((highestContributor.advancePaid || 0) + (highestContributor.personallyPaid || 0)).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Settlement Summary</CardTitle>
            <CardDescription>
              Final breakdown of expenses and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!settlements || settlements.length === 0) ? (
              <div className="text-center py-6 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>No participants or expenses to calculate settlements</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        onClick={() => handleSort('name')}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-1">
                          Participant
                          {sortBy === 'name' && (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('advancePaid')}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-1">
                          Advance Paid
                          {sortBy === 'advancePaid' && (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('personallyPaid')}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-1">
                          Paid Personally
                          {sortBy === 'personallyPaid' && (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('expenseShare')}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-1">
                          Expense Share
                          {sortBy === 'expenseShare' && (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('dueAmount')}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-1">
                          Due Amount
                          {sortBy === 'dueAmount' && (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('refundAmount')}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-1">
                          Refund Amount
                          {sortBy === 'refundAmount' && (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Donate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSettlements.map((settlement) => (
                      <TableRow key={settlement.participantId}>
                        <TableCell className="font-medium">
                          {settlement.name}
                        </TableCell>
                        <TableCell>
                          ${(settlement.advancePaid || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ${(settlement.personallyPaid || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ${(settlement.expenseShare || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className={(settlement.dueAmount || 0) > 0 ? 'text-travel-error font-medium' : ''}>
                          {(settlement.dueAmount || 0) > 0 ? `$${(settlement.dueAmount || 0).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className={(settlement.refundAmount || 0) > 0 ? 'text-travel-secondary font-medium' : ''}>
                          {(settlement.refundAmount || 0) > 0 ? `$${(settlement.refundAmount || 0).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {(settlement.refundAmount || 0) > 0 ? (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={settlement.donated || false}
                                onCheckedChange={(checked) => 
                                  handleDonationToggle(settlement.participantId, checked)
                                }
                                id={`donate-switch-${settlement.participantId}`}
                              />
                              {settlement.donated && (
                                <Gift className="h-4 w-4 text-travel-accent" />
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {totalDonated > 0 && (
              <div className="mt-4 p-3 bg-travel-accent/10 rounded-md flex items-center gap-2">
                <Gift className="h-5 w-5 text-travel-accent" />
                <div>
                  <p className="font-medium">Donations: ${totalDonated.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    Total amount from refunds donated to the group
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Summary;
