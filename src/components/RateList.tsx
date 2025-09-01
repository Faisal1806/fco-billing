
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Rate = {
    normal: string;
    extraordinary?: string;
};

type DailyRates = {
    [key: string]: Rate;
};

export default function RateList() {
  const [rates, setRates] = useState<DailyRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableRates, setEditableRates] = useState<DailyRates>({});
  const { toast } = useToast();
  const db = getClientDb();

  useEffect(() => {
    if (!db) {
        setLoading(false);
        return;
    };

    const fetchRates = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "rates", "today");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as DailyRates;
          setRates(data);
          setEditableRates(JSON.parse(JSON.stringify(data))); // Deep copy for editing
        } else {
          setRates({});
          setEditableRates({});
        }
      } catch (error) {
        console.error("Error fetching rates:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch rates from the database.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, [db, toast]);
  
  const handleEditToggle = () => {
    if (isEditing) {
        // If canceling, revert to original rates
        setEditableRates(JSON.parse(JSON.stringify(rates || {})));
    }
    setIsEditing(!isEditing);
  }

  const handleRateChange = (fruit: string, type: 'normal' | 'extraordinary', value: string) => {
    setEditableRates(prev => ({
        ...prev,
        [fruit]: {
            ...prev[fruit],
            [type]: value,
        }
    }))
  }
  
  const handleAddFruit = () => {
    const newFruitInput = document.getElementById('new-fruit-name') as HTMLInputElement;
    const newFruitName = newFruitInput?.value.trim();
    if (newFruitName && !editableRates[newFruitName]) {
        setEditableRates(prev => ({...prev, [newFruitName]: {normal: '', extraordinary: ''}}))
        newFruitInput.value = '';
    } else {
        toast({variant: 'destructive', title: 'Invalid Name', description: 'Fruit name cannot be empty or a duplicate.'})
    }
  };

  const handleDeleteFruit = (fruit: string) => {
    if (window.confirm(`Are you sure you want to delete "${fruit}"? This will be saved permanently when you click "Save Changes".`)) {
        setEditableRates(prev => {
            const newRates = {...prev};
            delete newRates[fruit];
            return newRates;
        });
    }
  }


  const handleSaveChanges = async () => {
    if (!db) {
      toast({ variant: "destructive", title: "Database not available" });
      return;
    }
    setIsSaving(true);
    try {
        const docRef = doc(db, "rates", "today");
        
        const originalKeys = Object.keys(rates || {});
        const newKeys = Object.keys(editableRates);

        const updates: { [key: string]: any } = { ...editableRates };

        // Find keys that were in original rates but not in new rates and mark them for deletion
        for (const key of originalKeys) {
            if (!newKeys.includes(key)) {
                updates[key] = deleteField();
            }
        }
        
        await setDoc(docRef, updates, { merge: true }); // Use merge:true to update/add/delete fields
        setRates(editableRates);
        setIsEditing(false);
        toast({
            title: "Rates Updated",
            description: "The new rates have been saved successfully.",
        });
    } catch (error) {
        console.error("Error saving rates: ", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save the rates to the database.",
        });
    } finally {
        setIsSaving(false);
    }
  }


  if (loading) {
    return (
        <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-lg">Loading today's rates...</p>
        </div>
    );
  }

  if (!db) {
    return (
       <Card className="text-center">
         <CardHeader>
           <CardTitle>Database Not Available</CardTitle>
         </CardHeader>
         <CardContent>
            <p className="text-muted-foreground">Please enable Firestore in your Firebase project to manage rates.</p>
         </CardContent>
       </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-2xl font-bold text-primary">
                    📊 Daily Rate Editor
                </CardTitle>
                <CardDescription>
                    {isEditing ? "Modify the rates below and click save." : "View the current rates or click edit."}
                </CardDescription>
            </div>
            <Button onClick={handleEditToggle} variant="outline" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" />
                {isEditing ? "Cancel" : "Edit Rates"}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
          {Object.keys(editableRates).length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(editableRates).map(([fruit, rate]) => (
                <Card
                    key={fruit}
                    className="shadow-lg rounded-2xl border hover:shadow-xl transition-shadow duration-300"
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-xl">{fruit}</CardTitle>
                         {isEditing && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteFruit(fruit)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                         )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor={`${fruit}-normal`}>Normal Rate</Label>
                            <Input
                                id={`${fruit}-normal`}
                                value={rate.normal || ''}
                                readOnly={!isEditing}
                                onChange={(e) => handleRateChange(fruit, 'normal', e.target.value)}
                                className={!isEditing ? "border-none bg-transparent px-1 h-auto" : ""}
                            />
                        </div>
                         <div>
                            <Label htmlFor={`${fruit}-extraordinary`}>Extraordinary Rate</Label>
                            <Input
                                id={`${fruit}-extraordinary`}
                                value={rate.extraordinary || ''}
                                readOnly={!isEditing}
                                onChange={(e) => handleRateChange(fruit, 'extraordinary', e.target.value)}
                                className={!isEditing ? "border-none bg-transparent px-1 h-auto" : ""}
                            />
                        </div>
                    </CardContent>
                </Card>
                ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                <p>No rates available for today.</p>
                {!isEditing && <p className="text-sm mt-2">Click "Edit Rates" to add the first variety.</p>}
            </div>
          )}
          {isEditing && (
            <div className="mt-8 p-4 border-dashed border-2 rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2 text-lg">Add New Variety</h3>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Input placeholder="e.g., Delicious" id="new-fruit-name" className="flex-grow" />
                    <Button onClick={handleAddFruit}>Add Variety</Button>
                 </div>
            </div>
          )}
      </CardContent>
      {isEditing && (
        <CardFooter className="border-t pt-6 mt-6">
            <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full sm:w-auto gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Changes"}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
