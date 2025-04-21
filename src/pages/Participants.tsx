
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravel } from '@/context/TravelContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Participant, ParticipationPeriod } from '@/types/models';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Pencil, Trash, Plus } from 'lucide-react';

const Participants = () => {
  const { currentTravel, addParticipant, updateParticipant, deleteParticipant, validateParticipationPeriod } = useTravel();
  const navigate = useNavigate();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participationPeriods, setParticipationPeriods] = useState<ParticipationPeriod[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [initialContribution, setInitialContribution] = useState('');
  const [nameError, setNameError] = useState('');
  
  // Load participants from currentTravel whenever it changes
  useEffect(() => {
    if (currentTravel) {
      setParticipants(currentTravel.participants || []);
    }
  }, [currentTravel]);
  
  // Redirect if no current travel
  useEffect(() => {
    if (!currentTravel) {
      navigate('/');
    }
  }, [currentTravel, navigate]);
  
  if (!currentTravel) {
    return null;
  }
  
  const resetForm = () => {
    setName('');
    setEmail('');
    setInitialContribution('');
    setNameError('');
    setParticipationPeriods([{
      id: Date.now().toString(),
      startDate: currentTravel.startDate,
      endDate: currentTravel.endDate,
    }]);
  };
  
  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };
  
  const handleAddSubmit = () => {
    if (!name) {
      setNameError('Please enter a name');
      return;
    }
    
    // Validate all periods
    for (const period of participationPeriods) {
      if (!validateParticipationPeriod(period)) {
        return;
      }
    }
    
    // Convert initial contribution
    const contribution = initialContribution ? parseFloat(initialContribution) : undefined;
    
    addParticipant(
      name,
      email || undefined,
      participationPeriods,
      contribution
    );
    
    setIsAddDialogOpen(false);
    resetForm();
  };
  
  const openEditDialog = (participant: Participant) => {
    setEditingParticipant(participant);
    setName(participant.name);
    setEmail(participant.email || '');
    
    // Set the periods
    setParticipationPeriods(
      participant.participationPeriods.map(period => ({
        id: period.id,
        startDate: period.startDate,
        endDate: period.endDate,
      }))
    );
    
    setIsEditDialogOpen(true);
  };
  
  const handleEditSubmit = () => {
    if (!editingParticipant || !name) {
      setNameError('Please enter a name');
      return;
    }
    
    // Validate all periods
    for (const period of participationPeriods) {
      if (!validateParticipationPeriod(period)) {
        return;
      }
    }
    
    const updatedParticipant: Participant = {
      ...editingParticipant,
      name,
      email: email || undefined,
      participationPeriods,
    };
    
    updateParticipant(updatedParticipant);
    setIsEditDialogOpen(false);
    resetForm();
    setEditingParticipant(null);
  };
  
  const addPeriod = () => {
    setParticipationPeriods([
      ...participationPeriods,
      {
        id: Date.now().toString(),
        startDate: currentTravel.startDate,
        endDate: currentTravel.endDate,
      },
    ]);
  };
  
  const removePeriod = (index: number) => {
    if (participationPeriods.length <= 1) return;
    
    const newPeriods = [...participationPeriods];
    newPeriods.splice(index, 1);
    setParticipationPeriods(newPeriods);
  };
  
  const updatePeriodStartDate = (index: number, date: Date) => {
    const newPeriods = [...participationPeriods];
    newPeriods[index] = {
      ...newPeriods[index],
      startDate: date
    };
    setParticipationPeriods(newPeriods);
  };
  
  const updatePeriodEndDate = (index: number, date: Date) => {
    const newPeriods = [...participationPeriods];
    newPeriods[index] = {
      ...newPeriods[index],
      endDate: date
    };
    setParticipationPeriods(newPeriods);
  };

  // Disable dates outside of travel period
  const disabledDate = (current: Date) => {
    if (!currentTravel) return false;
    
    // Prevent dates before travel start or after travel end
    return current < currentTravel.startDate || current > currentTravel.endDate;
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Participants ({participants.length})</h1>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Participant
          </Button>
        </div>
        
        {/* Participant List */}
        {participants.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No participants added yet</p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first participant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map((participant) => (
              <Card key={participant.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-lg">{participant.name}</h3>
                      {participant.email && (
                        <p className="text-muted-foreground text-sm">{participant.email}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(participant)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Participant</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this participant? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteParticipant(participant.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Participation Periods:</h4>
                    {participant.participationPeriods.map((period, index) => (
                      <div key={period.id} className="text-sm p-2 bg-muted rounded-md mb-2">
                        {format(new Date(period.startDate), "MMM d")} - {format(new Date(period.endDate), "MMM d, yyyy")}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Participant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Add a new participant to your travel
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
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
              <Label htmlFor="email">Email (optional)</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="initialContribution">Initial Contribution (optional)</Label>
              <Input 
                id="initialContribution" 
                type="number" 
                step="0.01"
                min="0"
                value={initialContribution} 
                onChange={(e) => setInitialContribution(e.target.value)}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Participation Periods</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addPeriod}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Period
                </Button>
              </div>
              
              {participationPeriods.map((period, index) => (
                <div key={period.id} className="p-3 border rounded-md relative">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(new Date(period.startDate), "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(period.startDate)}
                            onSelect={(date) => date && updatePeriodStartDate(index, date)}
                            disabled={(date) => disabledDate(date) || date > new Date(period.endDate)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(new Date(period.endDate), "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(period.endDate)}
                            onSelect={(date) => date && updatePeriodEndDate(index, date)}
                            disabled={(date) => disabledDate(date) || date < new Date(period.startDate)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  {participationPeriods.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removePeriod(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddSubmit}>
              Add Participant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Participant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) setEditingParticipant(null);
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>
              Update participant information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input 
                id="edit-name" 
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
              <Label htmlFor="edit-email">Email (optional)</Label>
              <Input 
                id="edit-email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Participation Periods</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addPeriod}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Period
                </Button>
              </div>
              
              {participationPeriods.map((period, index) => (
                <div key={period.id} className="p-3 border rounded-md relative">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(new Date(period.startDate), "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(period.startDate)}
                            onSelect={(date) => date && updatePeriodStartDate(index, date)}
                            disabled={(date) => disabledDate(date) || date > new Date(period.endDate)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(new Date(period.endDate), "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(period.endDate)}
                            onSelect={(date) => date && updatePeriodEndDate(index, date)}
                            disabled={(date) => disabledDate(date) || date < new Date(period.startDate)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  {participationPeriods.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removePeriod(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Participants;
