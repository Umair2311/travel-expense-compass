import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarIcon, Trash } from 'lucide-react';
import { useTravel } from '@/context/TravelContext';
import { Expense, ExpenseType } from '@/types/models';
import { cn } from '@/lib/utils';

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

const ExpenseFormDialog: React.FC<ExpenseFormDialogProps> = ({
  isOpen,
  onOpenChange,
  expense,
}) => {
  const { currentTravel, addExpense, updateExpense, isParticipantPresentOnDate } = useTravel();
  
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [date, setDate] = useState<Date>(expense?.date || new Date());
  const [type, setType] = useState<ExpenseType>(expense?.type || 'Meal');
  const [customType, setCustomType] = useState(expense?.customType || '');
  const [paidFromFund, setPaidFromFund] = useState(expense?.paidFromFund || false);
  const [comment, setComment] = useState(expense?.comment || '');
  const [amountError, setAmountError] = useState('');
  
  // For payers
  const [payers, setPayers] = useState<{ participantId: string; amount: number }[]>(
    expense?.paidBy || []
  );
  
  // For expense sharing
  const [participants, setParticipants] = useState<
    { participantId: string; included: boolean; weight: number }[]
  >(expense?.sharedAmong || []);
  
  // Recalculate participants when date changes to auto-include based on presence
  useEffect(() => {
    if (!currentTravel) return;
    
    const newParticipants = currentTravel.participants.map(participant => {
      // Check if participant is already in the list
      const existing = participants.find(p => p.participantId === participant.id);
      
      // Default to included if present on that date, or keep existing state
      const isPresent = isParticipantPresentOnDate(participant.id, date);
      const included = existing ? existing.included : isPresent;
      
      return {
        participantId: participant.id,
        included,
        weight: existing?.weight || 1, // Default weight is 1
      };
    });
    
    setParticipants(newParticipants);
  }, [date, currentTravel, isParticipantPresentOnDate]);
  
  // Initialize payers and participants when expense changes
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setDate(expense.date);
      setType(expense.type);
      setCustomType(expense.customType || '');
      setPaidFromFund(expense.paidFromFund);
      setComment(expense.comment || '');
      setPayers(expense.paidBy);
      setParticipants(expense.sharedAmong);
    } else {
      // Reset form for new expense
      setAmount('');
      setDate(new Date());
      setType('Meal');
      setCustomType('');
      setPaidFromFund(false);
      setComment('');
      
      // Initialize payers with all participants and zero amounts
      if (currentTravel) {
        setPayers(
          currentTravel.participants.map(p => ({
            participantId: p.id,
            amount: 0,
          }))
        );
      }
      
      // Initialize participants with all participants included if present on selected date
      if (currentTravel) {
        setParticipants(
          currentTravel.participants.map(p => ({
            participantId: p.id,
            included: isParticipantPresentOnDate(p.id, date),
            weight: 1,
          }))
        );
      }
    }
  }, [expense, currentTravel, isParticipantPresentOnDate]);
  
  const handleSubmit = () => {
    if (!currentTravel) return;
    
    // Validate
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    
    const numericAmount = parseFloat(amount);
    
    // Filter out payers with zero amount
    const filteredPayers = paidFromFund 
      ? [] 
      : payers.filter(p => p.amount > 0);
    
    // Verify total paid amount equals expense amount
    if (!paidFromFund) {
      const totalPaid = filteredPayers.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - numericAmount) > 0.01) {
        setAmountError('Total paid must equal the expense amount');
        return;
      }
    }
    
    if (expense) {
      // Update existing expense
      updateExpense({
        ...expense,
        amount: numericAmount,
        date,
        type,
        customType: type === 'Custom' ? customType : undefined,
        paidBy: filteredPayers,
        paidFromFund,
        sharedAmong: participants,
        comment: comment || undefined,
      });
    } else {
      // Add new expense
      addExpense(
        numericAmount,
        date,
        type,
        type === 'Custom' ? customType : undefined,
        filteredPayers,
        paidFromFund,
        participants,
        comment || undefined
      );
    }
    
    onOpenChange(false);
  };
  
  const updatePayerAmount = (participantId: string, newAmount: number) => {
    setPayers(prev =>
      prev.map(p =>
        p.participantId === participantId ? { ...p, amount: newAmount } : p
      )
    );
    setAmountError('');
  };
  
  const updateParticipantInclusion = (participantId: string, included: boolean) => {
    setParticipants(prev =>
      prev.map(p =>
        p.participantId === participantId ? { ...p, included } : p
      )
    );
  };
  
  const updateParticipantWeight = (participantId: string, weight: number) => {
    setParticipants(prev =>
      prev.map(p =>
        p.participantId === participantId ? { ...p, weight } : p
      )
    );
  };
  
  const getRemainingAmount = (): number => {
    const expenseAmount = parseFloat(amount) || 0;
    const paidAmount = payers.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, expenseAmount - paidAmount);
  };
  
  const distributeRemaining = () => {
    const remaining = getRemainingAmount();
    if (remaining <= 0 || payers.length === 0) return;
    
    // Count active payers (those with existing non-zero amounts or the first if none)
    const activePayers = payers.filter(p => p.amount > 0);
    const numActivePayers = activePayers.length > 0 ? activePayers.length : 1;
    
    // Calculate share per active payer
    const sharePerPayer = remaining / numActivePayers;
    
    setPayers(prev => {
      if (activePayers.length > 0) {
        // Distribute among active payers
        return prev.map(p => {
          if (p.amount > 0) {
            return { ...p, amount: p.amount + sharePerPayer };
          }
          return p;
        });
      } else {
        // If no active payers, assign to first payer
        return prev.map((p, index) => {
          if (index === 0) {
            return { ...p, amount: sharePerPayer };
          }
          return p;
        });
      }
    });
    
    setAmountError('');
  };
  
  const getParticipantName = (participantId: string): string => {
    const participant = currentTravel?.participants.find(p => p.id === participantId);
    return participant?.name || 'Unknown';
  };
  
  const isParticipantPresent = (participantId: string): boolean => {
    return isParticipantPresentOnDate(participantId, date);
  };
  
  if (!currentTravel) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogDescription>
            {expense ? 'Edit the details of this expense' : 'Add a new expense to your travel'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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
                <p className="text-sm text-red-500 mt-1">{amountError}</p>
              )}
            </div>
            
            <div>
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
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: ExpenseType) => setType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meal">Meal</SelectItem>
                  <SelectItem value="Fuel">Fuel</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {type === 'Custom' && (
              <div>
                <Label htmlFor="custom-type">Custom Type</Label>
                <Input
                  id="custom-type"
                  placeholder="e.g., Museum tickets"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Paid from Travel Fund</Label>
              <Switch 
                checked={paidFromFund} 
                onCheckedChange={setPaidFromFund} 
              />
            </div>
            {!paidFromFund && (
              <div className="mt-2 border rounded-md p-3">
                <div className="flex justify-between items-center mb-3">
                  <Label>Paid By</Label>
                  <div className="text-sm flex gap-2">
                    <span>Remaining: ${getRemainingAmount().toFixed(2)}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={distributeRemaining} 
                      disabled={getRemainingAmount() <= 0}
                    >
                      Distribute
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Participant</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payers.map((payer) => (
                        <TableRow key={payer.participantId}>
                          <TableCell className="font-medium">
                            {getParticipantName(payer.participantId)}
                            {!isParticipantPresent(payer.participantId) && (
                              <span className="text-muted-foreground text-xs ml-2">(not present)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={payer.amount || ''}
                              onChange={(e) => 
                                updatePayerAmount(
                                  payer.participantId, 
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 text-right"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Shared Among</Label>
            </div>
            <div className="border rounded-md p-3">
              <div className="max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead className="text-center">Include</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.participantId}>
                        <TableCell className="font-medium">
                          {getParticipantName(participant.participantId)}
                          {!isParticipantPresent(participant.participantId) && (
                            <span className="text-muted-foreground text-xs ml-2">(not present)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={participant.included}
                            onCheckedChange={(checked) => 
                              updateParticipantInclusion(participant.participantId, !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={participant.weight}
                            onChange={(e) => 
                              updateParticipantWeight(
                                participant.participantId, 
                                parseFloat(e.target.value) || 1
                              )
                            }
                            disabled={!participant.included}
                            className="w-20 text-right"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Add any additional details about this expense"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {expense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseFormDialog;
