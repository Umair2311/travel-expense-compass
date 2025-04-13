
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
  Calendar
} from 'lucide-react';
import Layout from '@/components/Layout';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Participant, DateRange } from '@/types/models';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

const Participants = () => {
  const { currentTravel, addParticipant, updateParticipant, removeParticipant } = useTravel();
  const navigate = useNavigate();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [participationPeriods, setParticipationPeriods] = useState<DateRange[]>([{
    startDate: currentTravel?.startDate || new Date(),
    endDate: currentTravel?.endDate || new Date(),
  }]);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [nameError, setNameError] = useState('');
  
  // Redirect if no current travel
  if (!currentTravel) {
    navigate('/');
    return null;
  }
  
  const handleAddParticipant = () => {
    if (!name.trim()) {
      setNameError('Please enter a name');
      return;
    }
    
    addParticipant(name, email || undefined, participationPeriods);
    
    // Reset form
    setName('');
    setEmail('');
    setParticipationPeriods([{
      startDate: currentTravel.startDate,
      endDate: currentTravel.endDate,
    }]);
    setNameError('');
    setIsAddDialogOpen(false);
  };
  
  const handleEditParticipant = () => {
    if (!editingParticipant) return;
    if (!name.trim()) {
      setNameError('Please enter a name');
      return;
    }
    
    const updatedParticipant: Participant = {
      ...editingParticipant,
      name,
      email: email || undefined,
      participationPeriods: participationPeriods.map(period => ({
        id: period.id || Math.random().toString(36).substr(2, 9),
        startDate: period.startDate,
        endDate: period.endDate,
      })),
    };
    
    updateParticipant(updatedParticipant);
    
    // Reset form
    setEditingParticipant(null);
    setName('');
    setEmail('');
    setParticipationPeriods([{
      startDate: currentTravel.startDate,
      endDate: currentTravel.endDate,
    }]);
    setNameError('');
    setIsEditDialogOpen(false);
  };
  
  const openEditDialog = (participant: Participant) => {
    setEditingParticipant(participant);
    setName(participant.name);
    setEmail(participant.email || '');
    setParticipationPeriods(
      participant.participationPeriods.map(period => ({
        id: period.id,
        startDate: period.startDate,
        endDate: period.endDate,
      }))
    );
    setIsEditDialogOpen(true);
  };
  
  const handleRemoveParticipant = (id: string) => {
    removeParticipant(id);
  };
  
  const addParticipationPeriod = () => {
    setParticipationPeriods([
      ...participationPeriods,
      {
        startDate: currentTravel.startDate,
        endDate: currentTravel.endDate,
      },
    ]);
  };
  
  const removeParticipationPeriod = (index: number) => {
    if (participationPeriods.length <= 1) return;
    
    setParticipationPeriods(
      participationPeriods.filter((_, i) => i !== index)
    );
  };
  
  const updateParticipationPeriod = (index: number, newPeriod: DateRange) => {
    setParticipationPeriods(
      participationPeriods.map((period, i) => (i === index ? newPeriod : period))
    );
  };
  
  const resetAddParticipantForm = () => {
    setName('');
    setEmail('');
    setParticipationPeriods([{
      startDate: currentTravel.startDate,
      endDate: currentTravel.endDate,
    }]);
    setNameError('');
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Participants</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetAddParticipantForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Participant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add Participant</DialogTitle>
                <DialogDescription>
                  Add a new participant to your travel group
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Participation Periods</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addParticipationPeriod}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" /> Add Period
                    </Button>
                  </div>
                  
                  {participationPeriods.map((period, index) => (
                    <div key={index} className="space-y-2 border rounded-md p-3 relative">
                      {participationPeriods.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeParticipationPeriod(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Label>Period {index + 1}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !period && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {period.startDate ? (
                              period.endDate ? (
                                <>
                                  {format(period.startDate, "LLL dd, y")} -{" "}
                                  {format(period.endDate, "LLL dd, y")}
                                </>
                              ) : (
                                format(period.startDate, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            initialFocus
                            mode="range"
                            defaultMonth={period.startDate}
                            selected={{
                              from: period.startDate,
                              to: period.endDate,
                            }}
                            onSelect={(range) => {
                              if (range?.from && range?.to) {
                                updateParticipationPeriod(index, {
                                  ...period,
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
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddParticipant}>Add Participant</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
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
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Participation Periods</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addParticipationPeriod}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" /> Add Period
                    </Button>
                  </div>
                  
                  {participationPeriods.map((period, index) => (
                    <div key={index} className="space-y-2 border rounded-md p-3 relative">
                      {participationPeriods.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeParticipationPeriod(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Label>Period {index + 1}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !period && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {period.startDate ? (
                              period.endDate ? (
                                <>
                                  {format(period.startDate, "LLL dd, y")} -{" "}
                                  {format(period.endDate, "LLL dd, y")}
                                </>
                              ) : (
                                format(period.startDate, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            initialFocus
                            mode="range"
                            defaultMonth={period.startDate}
                            selected={{
                              from: period.startDate,
                              to: period.endDate,
                            }}
                            onSelect={(range) => {
                              if (range?.from && range?.to) {
                                updateParticipationPeriod(index, {
                                  ...period,
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
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditParticipant}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {currentTravel.participants.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">No participants added yet</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add your first participant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentTravel.participants.map((participant) => (
              <Card key={participant.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{participant.name}</CardTitle>
                  {participant.email && (
                    <CardDescription>
                      {participant.email}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Participation Periods:
                    </div>
                    <div className="space-y-2">
                      {participant.participationPeriods.map((period, index) => (
                        <Badge key={index} variant="outline" className="block text-xs px-2 py-1 w-full text-left">
                          {format(period.startDate, "MMM d")} - {format(period.endDate, "MMM d, yyyy")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-6">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(participant)}
                    >
                      <PencilLine className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Trash className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Participant</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {participant.name} from this travel?
                            This action cannot be undone if they are part of any expenses.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveParticipant(participant.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Participants;
