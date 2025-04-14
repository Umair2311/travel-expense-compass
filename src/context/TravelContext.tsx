
import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Travel, Participant, Expense, DateRange, AdvanceContribution, Settlement, ExpensePayer, ExpenseParticipant, ParticipationPeriod, ExpenseType } from '@/types/models';
import { exportToExcel } from '@/services/excelService';
import { exportTravelToJSON, importTravelFromJSON } from '@/services/databaseService';

interface TravelContextType {
  travels: Travel[];
  currentTravel: Travel | null;
  setTravels: React.Dispatch<React.SetStateAction<Travel[]>>;
  setCurrentTravel: React.Dispatch<React.SetStateAction<Travel | null>>;
  createTravel: (name: string, startDate: Date, endDate: Date, currency: string, description?: string) => void;
  updateTravel: (id: string, name: string, startDate: Date, endDate: Date, currency: string, description?: string) => void;
  deleteTravel: (id: string) => void;
  addParticipant: (name: string, email?: string, participationPeriods?: ParticipationPeriod[], initialContribution?: number) => void;
  updateParticipant: (participant: Participant) => void;
  deleteParticipant: (id: string) => void;
  addExpense: (
    amount: number,
    date: Date,
    type: ExpenseType,
    customType?: string,
    paidBy: ExpensePayer[],
    paidFromFund: boolean,
    sharedAmong: ExpenseParticipant[],
    comment?: string
  ) => void;
  updateExpense: (
    expense: Expense
  ) => void;
  deleteExpense: (id: string) => void;
  addAdvanceContribution: (participantId: string, amount: number, date: Date, comment?: string) => void;
  updateAdvanceContribution: (id: string, participantId: string, amount: number, date: Date, comment?: string) => void;
  deleteAdvanceContribution: (id: string) => void;
  calculateSettlements: () => Settlement[];
  updateSettlementStatus: (fromId: string, toId: string, status: string) => void;
  exportToExcel: () => void;
  exportToJSON: () => void;
  importFromJSON: (file: File) => Promise<boolean>;
  isParticipantPresentOnDate: (participantId: string, date: Date) => boolean;
  validateParticipationPeriod: (period: { startDate: Date, endDate: Date }) => boolean;
}

export const TravelContext = createContext<TravelContextType>({
  travels: [],
  currentTravel: null,
  setTravels: () => {},
  setCurrentTravel: () => {},
  createTravel: () => {},
  updateTravel: () => {},
  deleteTravel: () => {},
  addParticipant: () => {},
  updateParticipant: () => {},
  deleteParticipant: () => {},
  addExpense: () => {},
  updateExpense: () => {},
  deleteExpense: () => {},
  addAdvanceContribution: () => {},
  updateAdvanceContribution: () => {},
  deleteAdvanceContribution: () => {},
  calculateSettlements: () => [],
  updateSettlementStatus: () => {},
  exportToExcel: () => {},
  exportToJSON: () => {},
  importFromJSON: async () => false,
  isParticipantPresentOnDate: () => false,
  validateParticipationPeriod: () => false,
});

export const TravelProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [travels, setTravels] = useState<Travel[]>(() => {
    try {
      const storedTravels = localStorage.getItem('travels');
      return storedTravels ? JSON.parse(storedTravels) : [];
    } catch (error) {
      console.error("Failed to load travels from local storage:", error);
      return [];
    }
  });
  const [currentTravel, setCurrentTravel] = useState<Travel | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('travels', JSON.stringify(travels));
    } catch (error) {
      console.error("Failed to save travels to local storage:", error);
      toast.error("Failed to save changes. Please check your browser's storage settings.");
    }
  }, [travels]);

  // Check if a participant is present on a specific date
  const isParticipantPresentOnDate = (participantId: string, date: Date): boolean => {
    if (!currentTravel) return false;
    
    const participant = currentTravel.participants.find(p => p.id === participantId);
    if (!participant) return false;
    
    return participant.participationPeriods.some(period => {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      const checkDate = new Date(date);
      
      // Set times to beginning of day for comparison
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= periodStart && checkDate <= periodEnd;
    });
  };

  // Validate if a participation period is within travel dates
  const validateParticipationPeriod = (period: { startDate: Date, endDate: Date }): boolean => {
    if (!currentTravel) return false;
    
    const travelStart = new Date(currentTravel.startDate);
    const travelEnd = new Date(currentTravel.endDate);
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);
    
    // Set times to beginning of day for comparison
    travelStart.setHours(0, 0, 0, 0);
    travelEnd.setHours(0, 0, 0, 0);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(0, 0, 0, 0);
    
    return periodStart >= travelStart && periodEnd <= travelEnd;
  };

  const createTravel = (name: string, startDate: Date, endDate: Date, currency: string, description?: string) => {
    const newTravel: Travel = {
      id: uuidv4(),
      name,
      startDate,
      endDate,
      currency,
      description,
      participants: [],
      expenses: [],
      advanceContributions: [],
      created: new Date(),
      updated: new Date(),
    };
    setTravels([...travels, newTravel]);
    setCurrentTravel(newTravel);
    toast.success(`Travel "${name}" created`);
  };

  const updateTravel = (id: string, name: string, startDate: Date, endDate: Date, currency: string, description?: string) => {
    setTravels(
      travels.map((travel) =>
        travel.id === id ? { ...travel, name, startDate, endDate, currency, description, updated: new Date() } : travel
      )
    );
    setCurrentTravel(prev => prev?.id === id ? { ...prev, name, startDate, endDate, currency, description, updated: new Date() } : prev);
    toast.success(`Travel "${name}" updated`);
  };

  const deleteTravel = (id: string) => {
    setTravels(travels.filter((travel) => travel.id !== id));
    setCurrentTravel(null);
    toast.success("Travel deleted");
  };

  const addParticipant = (name: string, email?: string, participationPeriods?: ParticipationPeriod[], initialContribution?: number) => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    const defaultPeriod: ParticipationPeriod = {
      id: uuidv4(),
      startDate: currentTravel.startDate,
      endDate: currentTravel.endDate
    };

    const newParticipant: Participant = {
      id: uuidv4(),
      name,
      email,
      participationPeriods: participationPeriods || [defaultPeriod],
    };

    const updatedParticipants = [...currentTravel.participants, newParticipant];
    
    setTravels(
      travels.map((travel) =>
        travel.id === currentTravel.id
          ? { ...travel, participants: updatedParticipants }
          : travel
      )
    );
    
    setCurrentTravel(prev => {
      if (!prev) return null;
      return { ...prev, participants: updatedParticipants };
    });
    
    toast.success(`Participant "${name}" added`);

    if (initialContribution && initialContribution > 0) {
      addAdvanceContribution(newParticipant.id, initialContribution, new Date(), "Initial contribution");
    }
  };

  const updateParticipant = (updatedParticipant: Participant) => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    setTravels(
      travels.map((travel) => {
        if (travel.id === currentTravel.id) {
          const updatedParticipants = travel.participants.map((participant) =>
            participant.id === updatedParticipant.id ? updatedParticipant : participant
          );
          return { ...travel, participants: updatedParticipants };
        }
        return travel;
      })
    );
    
    setCurrentTravel(prev => {
      if (!prev) return null;
      const updatedParticipants = prev.participants.map((participant) =>
        participant.id === updatedParticipant.id ? updatedParticipant : participant
      );
      return { ...prev, participants: updatedParticipants };
    });
    
    toast.success(`Participant "${updatedParticipant.name}" updated`);
  };

  const deleteParticipant = (id: string) => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    setTravels(
      travels.map((travel) => {
        if (travel.id === currentTravel.id) {
          const updatedParticipants = travel.participants.filter((participant) => participant.id !== id);
          return { ...travel, participants: updatedParticipants };
        }
        return travel;
      })
    );
    
    setCurrentTravel(prev => {
      if (!prev) return null;
      const updatedParticipants = prev.participants.filter((participant) => participant.id !== id);
      return { ...prev, participants: updatedParticipants };
    });
    
    toast.success("Participant deleted");
  };

  const addExpense = (
    amount: number,
    date: Date,
    type: ExpenseType,
    customType?: string,
    paidBy: ExpensePayer[],
    paidFromFund: boolean,
    sharedAmong: ExpenseParticipant[],
    comment?: string
  ) => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    const newExpense: Expense = {
      id: uuidv4(),
      amount,
      date,
      type,
      customType,
      paidBy,
      paidFromFund,
      sharedAmong,
      comment,
      created: new Date(),
      updated: new Date(),
    };

    setTravels(
      travels.map((travel) =>
        travel.id === currentTravel.id ? { ...travel, expenses: [...travel.expenses, newExpense] } : travel
      )
    );
    
    setCurrentTravel(prev => {
      if (!prev) return null;
      return { ...prev, expenses: [...prev.expenses, newExpense] };
    });
    
    toast.success("Expense added");
  };

  const updateExpense = (
    updatedExpense: Expense
  ) => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    setTravels(
      travels.map((travel) => {
        if (travel.id === currentTravel.id) {
          const updatedExpenses = travel.expenses.map((expense) =>
            expense.id === updatedExpense.id ? updatedExpense : expense
          );
          return { ...travel, expenses: updatedExpenses };
        }
        return travel;
      })
    );
    
    setCurrentTravel(prev => {
      if (!prev) return null;
      const updatedExpenses = prev.expenses.map((expense) =>
        expense.id === updatedExpense.id ? updatedExpense : expense
      );
      return { ...prev, expenses: updatedExpenses };
    });
    
    toast.success("Expense updated");
  };

  const deleteExpense = (id: string) => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    setTravels(
      travels.map((travel) => {
        if (travel.id === currentTravel.id) {
          const updatedExpenses = travel.expenses.filter((expense) => expense.id !== id);
          return { ...travel, expenses: updatedExpenses };
        }
        return travel;
      })
    );
    
    setCurrentTravel(prev => {
      if (!prev) return null;
      const updatedExpenses = prev.expenses.filter((expense) => expense.id !== id);
      return { ...prev, expenses: updatedExpenses };
    });
    
    toast.success("Expense deleted");
  };

  const addAdvanceContribution = (participantId: string, amount: number, date: Date, comment?: string) => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    const newContribution: AdvanceContribution = {
      id: uuidv4(),
      participantId,
      amount,
      date,
      comment,
      created: new Date(),
    };

    setTravels(
      travels.map((travel) =>
        travel.id === currentTravel.id
          ? { ...travel, advanceContributions: [...travel.advanceContributions, newContribution] }
          : travel
      )
    );
    
    setCurrentTravel(prev => {
      if (!prev) return null;
      return { ...prev, advanceContributions: [...prev.advanceContributions, newContribution] };
    });
    
    toast.success("Contribution added");
  };

  const updateAdvanceContribution = (id: string, participantId: string, amount: number, date: Date, comment?: string) => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    setTravels(
      travels.map((travel) => {
        if (travel.id === currentTravel.id) {
          const updatedContributions = travel.advanceContributions.map((contribution) =>
            contribution.id === id ? { ...contribution, participantId, amount, date, comment } : contribution
          );
          return { ...travel, advanceContributions: updatedContributions };
        }
        return travel;
      })
    );
    
    setCurrentTravel(prev => {
      if (!prev) return null;
      const updatedContributions = prev.advanceContributions.map((contribution) =>
        contribution.id === id ? { ...contribution, participantId, amount, date, comment } : contribution
      );
      return { ...prev, advanceContributions: updatedContributions };
    });
    
    toast.success("Contribution updated");
  };

  const deleteAdvanceContribution = (id: string) => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    setTravels(
      travels.map((travel) => {
        if (travel.id === currentTravel.id) {
          const updatedContributions = travel.advanceContributions.filter((contribution) => contribution.id !== id);
          return { ...travel, advanceContributions: updatedContributions };
        }
        return travel;
      })
    );
    
    setCurrentTravel(prev => {
      if (!prev) return null;
      const updatedContributions = prev.advanceContributions.filter((contribution) => contribution.id !== id);
      return { ...prev, advanceContributions: updatedContributions };
    });
    
    toast.success("Contribution deleted");
  };

  const calculateSettlements = () => {
    if (!currentTravel) {
      return [];
    }

    const { participants, expenses, advanceContributions } = currentTravel;

    // Calculate each participant's total expenses
    const participantExpenses: { [participantId: string]: number } = {};
    participants.forEach((p) => (participantExpenses[p.id] = 0));

    expenses.forEach((expense) => {
      // For paid expenses
      if (!expense.paidFromFund) {
        expense.paidBy.forEach(payer => {
          participantExpenses[payer.participantId] -= payer.amount;
        });
      }
      
      // For shared expenses
      const includedParticipants = expense.sharedAmong.filter(p => p.included);
      const totalWeight = includedParticipants.reduce((sum, p) => sum + p.weight, 0);
      
      if (totalWeight > 0) {
        includedParticipants.forEach(participant => {
          const share = (participant.weight / totalWeight) * expense.amount;
          participantExpenses[participant.participantId] = (participantExpenses[participant.participantId] || 0) + share;
        });
      }
    });

    // Adjust for advance contributions
    advanceContributions.forEach((contribution) => {
      participantExpenses[contribution.participantId] -= contribution.amount;
    });

    // Create settlements
    const settlements: Settlement[] = [];
    const sortedParticipants = Object.entries(participantExpenses).sort(([, a], [, b]) => a - b);

    let i = 0;
    let j = sortedParticipants.length - 1;

    while (i < j) {
      let debtorId = sortedParticipants[i][0];
      let creditorId = sortedParticipants[j][0];
      let amountOwed = sortedParticipants[i][1];
      let amountReceivable = -sortedParticipants[j][1];

      if (amountOwed <= 0) {
        i++;
        continue;
      }
      if (amountReceivable <= 0) {
        j--;
        continue;
      }

      let settlementAmount = Math.min(amountOwed, amountReceivable);

      settlements.push({
        participantId: debtorId,
        dueAmount: settlementAmount,
        refundAmount: 0,
        name: participants.find(p => p.id === debtorId)?.name || '',
        advancePaid: 0,
        personallyPaid: 0,
        expenseShare: 0,
        donated: false
      });

      sortedParticipants[i][1] -= settlementAmount;
      sortedParticipants[j][1] += settlementAmount;

      if (sortedParticipants[i][1] <= 0) {
        i++;
      }
      if (sortedParticipants[j][1] >= 0) {
        j--;
      }
    }

    return settlements;
  };

  const updateSettlementStatus = (fromId: string, toId: string, status: string) => {
    // This is a placeholder since the Settlement model doesn't include settlement status
    toast.success("Settlement status updated");
  };

  const handleExportToExcel = () => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    try {
      const settlements = calculateSettlements();
      
      exportToExcel({
        travel: currentTravel,
        participants: currentTravel.participants,
        expenses: currentTravel.expenses,
        settlements,
        contributions: currentTravel.advanceContributions
      });
      
      toast.success("Export successful");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
    }
  };

  const handleExportToJSON = () => {
    if (!currentTravel) {
      toast.error("No travel selected");
      return;
    }

    try {
      exportTravelToJSON(currentTravel);
      toast.success("JSON export successful");
    } catch (error) {
      console.error("JSON export error:", error);
      toast.error("JSON export failed");
    }
  };

  const handleImportFromJSON = async (file: File) => {
    try {
      const importedTravel = await importTravelFromJSON(file);
      
      // Check if travel with same ID already exists
      const existingTravelIndex = travels.findIndex(t => t.id === importedTravel.id);
      
      if (existingTravelIndex >= 0) {
        // Update existing travel
        setTravels(prev => prev.map(t => t.id === importedTravel.id ? importedTravel : t));
        setCurrentTravel(importedTravel);
        toast.success(`Travel "${importedTravel.name}" updated from JSON`);
      } else {
        // Add as new travel
        setTravels(prev => [...prev, importedTravel]);
        setCurrentTravel(importedTravel);
        toast.success(`Travel "${importedTravel.name}" imported from JSON`);
      }
      
      return true;
    } catch (error) {
      console.error("JSON import error:", error);
      toast.error("Failed to import travel data");
      return false;
    }
  };

  return (
    <TravelContext.Provider
      value={{
        travels,
        currentTravel,
        setTravels,
        setCurrentTravel,
        createTravel,
        updateTravel,
        deleteTravel,
        addParticipant,
        updateParticipant,
        deleteParticipant,
        addExpense,
        updateExpense,
        deleteExpense,
        addAdvanceContribution,
        updateAdvanceContribution,
        deleteAdvanceContribution,
        calculateSettlements,
        updateSettlementStatus,
        exportToExcel: handleExportToExcel,
        exportToJSON: handleExportToJSON,
        importFromJSON: handleImportFromJSON,
        isParticipantPresentOnDate,
        validateParticipationPeriod,
      }}
    >
      {children}
    </TravelContext.Provider>
  );
};

export const useTravel = () => useContext(TravelContext);
