
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Travel, Participant, Expense, AdvanceContribution, Settlement, ExpenseType, DateRange } from '../types/models';
import { format, isWithinInterval, differenceInDays, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface TravelContextType {
  travels: Travel[];
  currentTravel: Travel | null;
  setCurrentTravel: (travel: Travel | null) => void;
  createTravel: (name: string, dateRange: DateRange) => void;
  updateTravel: (travel: Travel) => void;
  deleteTravel: (id: string) => void;
  addParticipant: (name: string, email: string | undefined, participationPeriods: DateRange[]) => void;
  updateParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  addExpense: (
    amount: number,
    date: Date,
    type: ExpenseType,
    customType: string | undefined,
    paidBy: { participantId: string; amount: number }[],
    paidFromFund: boolean,
    sharedAmong: { participantId: string; included: boolean; weight: number }[],
    comment?: string
  ) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addAdvanceContribution: (participantId: string, amount: number, date: Date, comment?: string) => void;
  updateAdvanceContribution: (contribution: AdvanceContribution) => void;
  deleteAdvanceContribution: (id: string) => void;
  calculateSettlements: () => Settlement[];
  getTravelFundBalance: () => number;
  getTotalExpenses: () => number;
  isParticipantPresentOnDate: (participantId: string, date: Date) => boolean;
  markRefundAsDonated: (participantId: string, donated: boolean) => void;
  exportToExcel: () => void;
  getParticipantById: (id: string) => Participant | undefined;
  getExpenseTypeColor: (type: ExpenseType) => string;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'travelExpenseSplitter';

export const TravelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [currentTravel, setCurrentTravel] = useState<Travel | null>(null);
  const [refundDonations, setRefundDonations] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Convert string dates back to Date objects
        const processedTravels = parsedData.travels.map((travel: any) => ({
          ...travel,
          startDate: new Date(travel.startDate),
          endDate: new Date(travel.endDate),
          created: new Date(travel.created),
          updated: new Date(travel.updated),
          participants: travel.participants.map((p: any) => ({
            ...p,
            participationPeriods: p.participationPeriods.map((period: any) => ({
              ...period,
              startDate: new Date(period.startDate),
              endDate: new Date(period.endDate),
            })),
          })),
          expenses: travel.expenses.map((e: any) => ({
            ...e,
            date: new Date(e.date),
            created: new Date(e.created),
            updated: new Date(e.updated),
          })),
          advanceContributions: travel.advanceContributions.map((a: any) => ({
            ...a,
            date: new Date(a.date),
            created: new Date(a.created),
          })),
        }));
        
        setTravels(processedTravels);
        setRefundDonations(parsedData.refundDonations || {});
        
        if (parsedData.currentTravelId && processedTravels.length > 0) {
          const current = processedTravels.find((t: Travel) => t.id === parsedData.currentTravelId);
          if (current) {
            setCurrentTravel(current);
          }
        }
      } catch (error) {
        console.error('Failed to parse saved travel data:', error);
        toast({
          title: 'Error loading saved data',
          description: 'Your saved travel data could not be loaded properly.',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      travels,
      currentTravelId: currentTravel?.id,
      refundDonations,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [travels, currentTravel, refundDonations]);

  const createTravel = (name: string, dateRange: DateRange) => {
    const newTravel: Travel = {
      id: uuidv4(),
      name,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      participants: [],
      expenses: [],
      advanceContributions: [],
      created: new Date(),
      updated: new Date(),
    };

    setTravels((prev) => [...prev, newTravel]);
    setCurrentTravel(newTravel);
    toast({
      title: 'Travel created',
      description: `"${name}" has been created successfully.`,
    });
  };

  const updateTravel = (updatedTravel: Travel) => {
    setTravels((prev) =>
      prev.map((travel) =>
        travel.id === updatedTravel.id
          ? { ...updatedTravel, updated: new Date() }
          : travel
      )
    );

    if (currentTravel?.id === updatedTravel.id) {
      setCurrentTravel({ ...updatedTravel, updated: new Date() });
    }

    toast({
      title: 'Travel updated',
      description: `"${updatedTravel.name}" has been updated.`,
    });
  };

  const deleteTravel = (id: string) => {
    const travelToDelete = travels.find(t => t.id === id);
    
    setTravels((prev) => prev.filter((travel) => travel.id !== id));
    
    if (currentTravel?.id === id) {
      setCurrentTravel(null);
    }

    if (travelToDelete) {
      toast({
        title: 'Travel deleted',
        description: `"${travelToDelete.name}" has been deleted.`,
      });
    }
  };

  const addParticipant = (name: string, email: string | undefined, participationPeriods: DateRange[]) => {
    if (!currentTravel) return;

    const newParticipant: Participant = {
      id: uuidv4(),
      name,
      email,
      participationPeriods: participationPeriods.map(period => ({
        id: uuidv4(),
        startDate: period.startDate,
        endDate: period.endDate,
      })),
    };

    const updatedTravel: Travel = {
      ...currentTravel,
      participants: [...currentTravel.participants, newParticipant],
      updated: new Date(),
    };

    setCurrentTravel(updatedTravel);
    setTravels((prev) =>
      prev.map((travel) => (travel.id === currentTravel.id ? updatedTravel : travel))
    );

    toast({
      title: 'Participant added',
      description: `${name} has been added to the travel.`,
    });
  };

  const updateParticipant = (updatedParticipant: Participant) => {
    if (!currentTravel) return;

    const updatedTravel: Travel = {
      ...currentTravel,
      participants: currentTravel.participants.map((p) =>
        p.id === updatedParticipant.id ? updatedParticipant : p
      ),
      updated: new Date(),
    };

    setCurrentTravel(updatedTravel);
    setTravels((prev) =>
      prev.map((travel) => (travel.id === currentTravel.id ? updatedTravel : travel))
    );

    toast({
      title: 'Participant updated',
      description: `${updatedParticipant.name}'s details have been updated.`,
    });
  };

  const removeParticipant = (id: string) => {
    if (!currentTravel) return;

    const participantToRemove = currentTravel.participants.find(p => p.id === id);
    if (!participantToRemove) return;

    // Check if participant is part of any expense or contribution
    const isInExpenses = currentTravel.expenses.some(e => 
      e.paidBy.some(p => p.participantId === id) || 
      e.sharedAmong.some(p => p.participantId === id)
    );
    
    const isInContributions = currentTravel.advanceContributions.some(
      c => c.participantId === id
    );

    if (isInExpenses || isInContributions) {
      toast({
        title: 'Cannot remove participant',
        description: `${participantToRemove.name} is involved in expenses or contributions and cannot be removed.`,
        variant: 'destructive',
      });
      return;
    }

    const updatedTravel: Travel = {
      ...currentTravel,
      participants: currentTravel.participants.filter((p) => p.id !== id),
      updated: new Date(),
    };

    setCurrentTravel(updatedTravel);
    setTravels((prev) =>
      prev.map((travel) => (travel.id === currentTravel.id ? updatedTravel : travel))
    );

    toast({
      title: 'Participant removed',
      description: `${participantToRemove.name} has been removed from the travel.`,
    });
  };

  const addExpense = (
    amount: number,
    date: Date,
    type: ExpenseType,
    customType: string | undefined,
    paidBy: { participantId: string; amount: number }[],
    paidFromFund: boolean,
    sharedAmong: { participantId: string; included: boolean; weight: number }[],
    comment?: string
  ) => {
    if (!currentTravel) return;

    const newExpense: Expense = {
      id: uuidv4(),
      amount,
      date,
      type,
      customType: type === 'Custom' ? customType : undefined,
      paidBy,
      paidFromFund,
      sharedAmong,
      comment,
      created: new Date(),
      updated: new Date(),
    };

    const updatedTravel: Travel = {
      ...currentTravel,
      expenses: [...currentTravel.expenses, newExpense],
      updated: new Date(),
    };

    setCurrentTravel(updatedTravel);
    setTravels((prev) =>
      prev.map((travel) => (travel.id === currentTravel.id ? updatedTravel : travel))
    );

    toast({
      title: 'Expense added',
      description: `A new ${type.toLowerCase()} expense of ${amount.toFixed(2)} has been added.`,
    });
  };

  const updateExpense = (updatedExpense: Expense) => {
    if (!currentTravel) return;

    const updatedTravel: Travel = {
      ...currentTravel,
      expenses: currentTravel.expenses.map((e) =>
        e.id === updatedExpense.id ? { ...updatedExpense, updated: new Date() } : e
      ),
      updated: new Date(),
    };

    setCurrentTravel(updatedTravel);
    setTravels((prev) =>
      prev.map((travel) => (travel.id === currentTravel.id ? updatedTravel : travel))
    );

    toast({
      title: 'Expense updated',
      description: `The ${updatedExpense.type.toLowerCase()} expense has been updated.`,
    });
  };

  const deleteExpense = (id: string) => {
    if (!currentTravel) return;

    const expenseToDelete = currentTravel.expenses.find(e => e.id === id);
    if (!expenseToDelete) return;

    const updatedTravel: Travel = {
      ...currentTravel,
      expenses: currentTravel.expenses.filter((e) => e.id !== id),
      updated: new Date(),
    };

    setCurrentTravel(updatedTravel);
    setTravels((prev) =>
      prev.map((travel) => (travel.id === currentTravel.id ? updatedTravel : travel))
    );

    toast({
      title: 'Expense deleted',
      description: `The ${expenseToDelete.type.toLowerCase()} expense of ${expenseToDelete.amount.toFixed(2)} has been deleted.`,
    });
  };

  const addAdvanceContribution = (
    participantId: string,
    amount: number,
    date: Date,
    comment?: string
  ) => {
    if (!currentTravel) return;

    const participant = currentTravel.participants.find(p => p.id === participantId);
    if (!participant) return;

    const newContribution: AdvanceContribution = {
      id: uuidv4(),
      participantId,
      amount,
      date,
      comment,
      created: new Date(),
    };

    const updatedTravel: Travel = {
      ...currentTravel,
      advanceContributions: [...currentTravel.advanceContributions, newContribution],
      updated: new Date(),
    };

    setCurrentTravel(updatedTravel);
    setTravels((prev) =>
      prev.map((travel) => (travel.id === currentTravel.id ? updatedTravel : travel))
    );

    toast({
      title: 'Contribution added',
      description: `${participant.name} contributed ${amount.toFixed(2)} to the travel fund.`,
    });
  };

  const updateAdvanceContribution = (updatedContribution: AdvanceContribution) => {
    if (!currentTravel) return;

    const participant = currentTravel.participants.find(p => p.id === updatedContribution.participantId);
    if (!participant) return;

    const updatedTravel: Travel = {
      ...currentTravel,
      advanceContributions: currentTravel.advanceContributions.map((c) =>
        c.id === updatedContribution.id ? updatedContribution : c
      ),
      updated: new Date(),
    };

    setCurrentTravel(updatedTravel);
    setTravels((prev) =>
      prev.map((travel) => (travel.id === currentTravel.id ? updatedTravel : travel))
    );

    toast({
      title: 'Contribution updated',
      description: `${participant.name}'s contribution has been updated.`,
    });
  };

  const deleteAdvanceContribution = (id: string) => {
    if (!currentTravel) return;

    const contributionToDelete = currentTravel.advanceContributions.find(c => c.id === id);
    if (!contributionToDelete) return;

    const participant = currentTravel.participants.find(p => p.id === contributionToDelete.participantId);
    if (!participant) return;

    const updatedTravel: Travel = {
      ...currentTravel,
      advanceContributions: currentTravel.advanceContributions.filter((c) => c.id !== id),
      updated: new Date(),
    };

    setCurrentTravel(updatedTravel);
    setTravels((prev) =>
      prev.map((travel) => (travel.id === currentTravel.id ? updatedTravel : travel))
    );

    toast({
      title: 'Contribution deleted',
      description: `${participant.name}'s contribution of ${contributionToDelete.amount.toFixed(2)} has been deleted.`,
    });
  };

  const isParticipantPresentOnDate = (participantId: string, date: Date) => {
    if (!currentTravel) return false;

    const participant = currentTravel.participants.find((p) => p.id === participantId);
    if (!participant) return false;

    return participant.participationPeriods.some((period) =>
      isWithinInterval(date, {
        start: period.startDate,
        end: period.endDate,
      })
    );
  };

  const calculateSettlements = (): Settlement[] => {
    if (!currentTravel) return [];

    const settlements: Settlement[] = currentTravel.participants.map((participant) => {
      // Calculate total advance contributions by this participant
      const advancePaid = currentTravel.advanceContributions
        .filter((c) => c.participantId === participant.id)
        .reduce((sum, c) => sum + c.amount, 0);

      // Calculate total personally paid (not from fund)
      const personallyPaid = currentTravel.expenses
        .filter((e) => !e.paidFromFund)
        .flatMap((e) => e.paidBy)
        .filter((p) => p.participantId === participant.id)
        .reduce((sum, p) => sum + p.amount, 0);

      // Calculate total expense share
      let expenseShare = 0;
      currentTravel.expenses.forEach((expense) => {
        const participantIncluded = expense.sharedAmong.find(
          (p) => p.participantId === participant.id
        );

        if (participantIncluded && participantIncluded.included) {
          // Calculate total weights for this expense
          const totalWeight = expense.sharedAmong
            .filter((p) => p.included)
            .reduce((sum, p) => sum + p.weight, 0);

          if (totalWeight > 0) {
            // Calculate this participant's share based on weight
            expenseShare += (expense.amount * participantIncluded.weight) / totalWeight;
          }
        }
      });

      // Calculate net balance
      const totalPaid = advancePaid + personallyPaid;
      const dueAmount = Math.max(0, expenseShare - totalPaid);
      const refundAmount = Math.max(0, totalPaid - expenseShare);
      const donated = !!refundDonations[participant.id];

      return {
        participantId: participant.id,
        name: participant.name,
        advancePaid,
        personallyPaid,
        expenseShare,
        dueAmount,
        refundAmount,
        donated,
      };
    });

    return settlements;
  };

  const getTravelFundBalance = (): number => {
    if (!currentTravel) return 0;

    // Total contributions to fund
    const totalContributions = currentTravel.advanceContributions.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    // Total expenses paid from fund
    const totalFundExpenses = currentTravel.expenses
      .filter((e) => e.paidFromFund)
      .reduce((sum, e) => sum + e.amount, 0);

    return totalContributions - totalFundExpenses;
  };

  const getTotalExpenses = (): number => {
    if (!currentTravel) return 0;
    return currentTravel.expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const markRefundAsDonated = (participantId: string, donated: boolean) => {
    setRefundDonations((prev) => ({
      ...prev,
      [participantId]: donated,
    }));

    const participant = currentTravel?.participants.find(p => p.id === participantId);
    if (participant) {
      toast({
        title: donated ? 'Refund donated' : 'Donation canceled',
        description: donated 
          ? `${participant.name}'s refund has been marked as donated.` 
          : `${participant.name}'s refund is no longer marked as donated.`,
      });
    }
  };

  const exportToExcel = async () => {
    if (!currentTravel) {
      toast({
        title: 'No travel selected',
        description: 'Please select a travel first to export data.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use dynamic import to load library only when needed
      const XLSX = (await import('xlsx')).default;
      
      const settlements = calculateSettlements();
      
      // Create worksheet data
      const wsData = [
        ['Travel Expense Summary'],
        [`Travel Name: ${currentTravel.name}`],
        [`Travel Period: ${format(currentTravel.startDate, 'MMM d, yyyy')} - ${format(currentTravel.endDate, 'MMM d, yyyy')}`],
        [`Total Expenses: ${getTotalExpenses().toFixed(2)}`],
        [`Travel Fund Balance: ${getTravelFundBalance().toFixed(2)}`],
        [],
        ['Participant', 'Advance Paid', 'Personally Paid', 'Expense Share', 'Due Amount', 'Refund Amount', 'Donated'],
        ...settlements.map(s => [
          s.name,
          s.advancePaid.toFixed(2),
          s.personallyPaid.toFixed(2),
          s.expenseShare.toFixed(2),
          s.dueAmount.toFixed(2),
          s.refundAmount.toFixed(2),
          s.donated ? 'Yes' : 'No'
        ])
      ];
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      const colWidths = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
      ws['!cols'] = colWidths;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      
      // Create expenses worksheet
      const expensesData = [
        ['Expenses'],
        [],
        ['Date', 'Type', 'Amount', 'Paid By', 'Paid From Fund', 'Comment'],
        ...currentTravel.expenses.map(e => {
          const paidBy = e.paidBy.map(p => {
            const participant = currentTravel.participants.find(part => part.id === p.participantId);
            return `${participant?.name || 'Unknown'}: ${p.amount.toFixed(2)}`;
          }).join(', ');
          
          return [
            format(e.date, 'MMM d, yyyy'),
            e.type + (e.customType ? `: ${e.customType}` : ''),
            e.amount.toFixed(2),
            paidBy,
            e.paidFromFund ? 'Yes' : 'No',
            e.comment || ''
          ];
        })
      ];
      
      const expensesWs = XLSX.utils.aoa_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, expensesWs, 'Expenses');
      
      // Create contributions worksheet
      const contributionsData = [
        ['Advance Contributions'],
        [],
        ['Date', 'Participant', 'Amount', 'Comment'],
        ...currentTravel.advanceContributions.map(c => {
          const participant = currentTravel.participants.find(p => p.id === c.participantId);
          return [
            format(c.date, 'MMM d, yyyy'),
            participant?.name || 'Unknown',
            c.amount.toFixed(2),
            c.comment || ''
          ];
        })
      ];
      
      const contributionsWs = XLSX.utils.aoa_to_sheet(contributionsData);
      XLSX.utils.book_append_sheet(wb, contributionsWs, 'Contributions');
      
      // Create participants worksheet
      const participantsData = [
        ['Participants'],
        [],
        ['Name', 'Email', 'Participation Periods'],
        ...currentTravel.participants.map(p => {
          const periods = p.participationPeriods.map(period => 
            `${format(period.startDate, 'MMM d, yyyy')} - ${format(period.endDate, 'MMM d, yyyy')}`
          ).join(', ');
          
          return [
            p.name,
            p.email || '',
            periods
          ];
        })
      ];
      
      const participantsWs = XLSX.utils.aoa_to_sheet(participantsData);
      XLSX.utils.book_append_sheet(wb, participantsWs, 'Participants');
      
      // Generate filename from travel name (slugify)
      const filename = `${currentTravel.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}.xlsx`;
      
      // Export to file
      XLSX.writeFile(wb, filename);
      
      toast({
        title: 'Export successful',
        description: `Travel data has been exported to ${filename}.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export travel data to Excel.',
        variant: 'destructive',
      });
    }
  };

  const getParticipantById = (id: string): Participant | undefined => {
    return currentTravel?.participants.find(p => p.id === id);
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

  const contextValue: TravelContextType = {
    travels,
    currentTravel,
    setCurrentTravel,
    createTravel,
    updateTravel,
    deleteTravel,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addExpense,
    updateExpense,
    deleteExpense,
    addAdvanceContribution,
    updateAdvanceContribution,
    deleteAdvanceContribution,
    calculateSettlements,
    getTravelFundBalance,
    getTotalExpenses,
    isParticipantPresentOnDate,
    markRefundAsDonated,
    exportToExcel,
    getParticipantById,
    getExpenseTypeColor,
  };

  return (
    <TravelContext.Provider value={contextValue}>
      {children}
    </TravelContext.Provider>
  );
};

export const useTravel = (): TravelContextType => {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
};
