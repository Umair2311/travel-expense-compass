
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTravel } from '@/context/TravelContext';
import { format } from 'date-fns';
import { 
  PlusCircle, 
  Trash, 
  PencilLine, 
  Calendar,
  ReceiptText,
  Search
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Expense, ExpenseType } from '@/types/models';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ExpenseFormDialog from '@/components/ExpenseFormDialog';

const Expenses = () => {
  const { currentTravel, deleteExpense } = useTravel();
  const navigate = useNavigate();
  
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Redirect if no current travel
  if (!currentTravel) {
    navigate('/');
    return null;
  }
  
  const filteredExpenses = currentTravel.expenses
    .filter(expense => {
      // Filter by type
      if (filterType !== 'All' && expense.type !== filterType) {
        return false;
      }
      
      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      return (
        expense.type.toLowerCase().includes(searchLower) ||
        (expense.customType && expense.customType.toLowerCase().includes(searchLower)) ||
        expense.comment?.toLowerCase().includes(searchLower) ||
        expense.paidBy.some(p => {
          const participant = currentTravel.participants.find(part => part.id === p.participantId);
          return participant?.name.toLowerCase().includes(searchLower);
        })
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };
  
  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
  };
  
  const getExpenseTypeColor = (type: ExpenseType): string => {
    switch (type) {
      case 'Meal':
        return 'bg-travel-meal';
      case 'Fuel':
        return 'bg-travel-fuel';
      case 'Hotel':
        return 'bg-travel-hotel';
      case 'Custom':
      default:
        return 'bg-travel-accent';
    }
  };
  
  const getPaidByText = (expense: Expense): string => {
    if (expense.paidFromFund) {
      return 'Travel Fund';
    }
    
    const payers = expense.paidBy.map(p => {
      const participant = currentTravel.participants.find(part => part.id === p.participantId);
      return participant?.name || 'Unknown';
    });
    
    return payers.join(', ');
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Expenses</h1>
          <Button onClick={() => setIsAddExpenseOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Meal">Meal</SelectItem>
              <SelectItem value="Fuel">Fuel</SelectItem>
              <SelectItem value="Hotel">Hotel</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {currentTravel.expenses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">No expenses recorded yet</p>
              <Button onClick={() => setIsAddExpenseOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add your first expense
              </Button>
            </CardContent>
          </Card>
        ) : filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">No expenses match your search</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id} className="expense-card">
                <div className="flex">
                  <div className={`${getExpenseTypeColor(expense.type)} w-2 h-full rounded-l-lg`} />
                  <div className="flex-1 p-4">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`category-pill ${getExpenseTypeColor(expense.type)} py-0.5`}>
                          {expense.type}
                        </span>
                        {expense.customType && (
                          <span className="text-sm">{expense.customType}</span>
                        )}
                      </div>
                      <div className="text-lg font-bold">${expense.amount.toFixed(2)}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{format(expense.date, 'MMM d, yyyy')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ReceiptText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Paid by: {getPaidByText(expense)}</span>
                      </div>
                    </div>
                    
                    {expense.comment && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {expense.comment}
                      </div>
                    )}
                    
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <PencilLine className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Trash className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this expense?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <ExpenseFormDialog
        isOpen={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        expense={null}
      />
      
      {editingExpense && (
        <ExpenseFormDialog
          isOpen={!!editingExpense}
          onOpenChange={(open) => {
            if (!open) setEditingExpense(null);
          }}
          expense={editingExpense}
        />
      )}
    </Layout>
  );
};

export default Expenses;
