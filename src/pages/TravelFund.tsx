
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
  PiggyBank,
  User,
  DollarSign,
  MessageSquare,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { AdvanceContribution } from '@/types/models';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const TravelFund = () => {
  const { 
    currentTravel, 
    addAdvanceContribution, 
    updateAdvanceContribution, 
    deleteAdvanceContribution,
    getTravelFundBalance,
  } = useTravel();
  const navigate = useNavigate();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [participantId, setParticipantId] = useState('');
  const [comment, setComment] = useState('');
  const [amountError, setAmountError] = useState('');
  const [participantError, setParticipantError] = useState('');
  const [editingContribution, setEditingContribution] = useState<AdvanceContribution | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  if (!currentTravel) {
    navigate('/');
    return null;
  }
  
  const fundBalance = getTravelFundBalance();
  const fundContributions = currentTravel.advanceContributions.reduce(
    (sum, c) => sum + c.amount, 
    0
  );
  const fundUsed = fundContributions - fundBalance;
  
  const sortedContributions = [...currentTravel.advanceContributions].sort((a, b) => {
    if (sortBy === 'date') {
      return sortDirection === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return sortDirection === 'asc'
        ? a.amount - b.amount
        : b.amount - a.amount;
    }
  });
  
  const handleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  const handleAddContribution = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    
    if (!participantId) {
      setParticipantError('Please select a participant');
      return;
    }
    
    addAdvanceContribution(
      participantId,
      parseFloat(amount),
      date,
      comment || undefined
    );
    
    setAmount('');
    setDate(new Date());
    setParticipantId('');
    setComment('');
    setAmountError('');
    setParticipantError('');
    setIsAddDialogOpen(false);
  };
  
  const handleEditContribution = () => {
    if (!editingContribution) return;
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    
    if (!participantId) {
      setParticipantError('Please select a participant');
      return;
    }
    
    const updatedContribution: AdvanceContribution = {
      ...editingContribution,
      participantId,
      amount: parseFloat(amount),
      date,
      comment: comment || undefined,
    };
    
    updateAdvanceContribution(updatedContribution);
    
    setEditingContribution(null);
    setAmount('');
    setDate(new Date());
    setParticipantId('');
    setComment('');
    setAmountError('');
    setParticipantError('');
    setIsEditDialogOpen(false);
  };
  
  const openEditDialog = (contribution: AdvanceContribution) => {
    setEditingContribution(contribution);
    setAmount(contribution.amount.toString());
    setDate(contribution.date);
    setParticipantId(contribution.participantId);
    setComment(contribution.comment || '');
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteContribution = (id: string) => {
    deleteAdvanceContribution(id);
  };
  
  const resetAddForm = () => {
    setAmount('');
    setDate(new Date());
    setParticipantId('');
    setComment('');
    setAmountError('');
    setParticipantError('');
  };
  
  const getParticipantName = (id: string): string => {
    const participant = currentTravel.participants.find(p => p.id === id);
    return participant?.name || 'Unknown';
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Travel Fund</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Contribution
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${fundContributions.toFixed(2)}
              </div>
              <div className="text-muted-foreground text-sm">
                {currentTravel.advanceContributions.length} contributions
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Used from Fund</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${fundUsed.toFixed(2)}
              </div>
              <div className="text-muted-foreground text-sm">
                {currentTravel.expenses.filter(e => e.paidFromFund).length} expenses
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${fundBalance.toFixed(2)}
              </div>
              <div className="text-muted-foreground text-sm">
                Available to spend
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Contributions</CardTitle>
            <CardDescription>
              All advance contributions to the travel fund
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentTravel.advanceContributions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="mb-4">No contributions recorded yet</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add your first contribution
                </Button>
              </div>
            ) : (
              <div>
                <div className="rounded-md border">
                  <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_1fr_auto_auto] gap-4 p-4 border-b bg-muted/50">
                    <div 
                      className="flex items-center gap-1 cursor-pointer font-medium"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      {sortBy === 'date' && (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )
                      )}
                    </div>
                    <div className="hidden md:block font-medium">Participant</div>
                    <div 
                      className="flex items-center justify-end gap-1 cursor-pointer font-medium"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      {sortBy === 'amount' && (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )
                      )}
                    </div>
                    <div className="text-right font-medium">Actions</div>
                  </div>
                  
                  {sortedContributions.map((contribution) => (
                    <div 
                      key={contribution.id} 
                      className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_1fr_auto_auto] gap-4 p-4 border-b last:border-b-0 items-center"
                    >
                      <div className="flex flex-col">
                        <span>{format(contribution.date, 'MMM d, yyyy')}</span>
                        <span className="text-muted-foreground text-sm md:hidden">
                          {getParticipantName(contribution.participantId)}
                        </span>
                        {contribution.comment && (
                          <span className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                            <MessageSquare className="h-3 w-3" />
                            {contribution.comment}
                          </span>
                        )}
                      </div>
                      <div className="hidden md:block">
                        {getParticipantName(contribution.participantId)}
                      </div>
                      <div className="text-right font-medium">
                        ${contribution.amount.toFixed(2)}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(contribution)}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Contribution</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this contribution?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteContribution(contribution.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>
              Add a new contribution to the travel fund
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="participant">Participant</Label>
              <Select 
                value={participantId} 
                onValueChange={(value) => {
                  setParticipantId(value);
                  setParticipantError('');
                }}
              >
                <SelectTrigger className={participantError ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  {currentTravel.participants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {participantError && (
                <p className="text-sm text-red-500">{participantError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountError('');
                }}
                className={amountError ? 'border-red-500' : ''}
              />
              {amountError && (
                <p className="text-sm text-red-500">{amountError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) setDate(newDate);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Add any additional details"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContribution}>
              Add Contribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {editingContribution && (
        <Dialog 
          open={isEditDialogOpen} 
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingContribution(null);
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Contribution</DialogTitle>
              <DialogDescription>
                Update contribution details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-participant">Participant</Label>
                <Select 
                  value={participantId} 
                  onValueChange={(value) => {
                    setParticipantId(value);
                    setParticipantError('');
                  }}
                >
                  <SelectTrigger className={participantError ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentTravel.participants.map((participant) => (
                      <SelectItem key={participant.id} value={participant.id}>
                        {participant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {participantError && (
                  <p className="text-sm text-red-500">{participantError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError('');
                  }}
                  className={amountError ? 'border-red-500' : ''}
                />
                {amountError && (
                  <p className="text-sm text-red-500">{amountError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        if (newDate) setDate(newDate);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-comment">Comment (Optional)</Label>
                <Textarea
                  id="edit-comment"
                  placeholder="Add any additional details"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditContribution}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
};

export default TravelFund;
