import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { searchBIOHistory } from "@/utils/supabase/queries";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/utils/cn";

interface BIOHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (history: any) => void;
  userEmail: string;
}

interface BIOHistoryItem {
  id: number;
  user_email: string;
  llm_type: string;
  language: string;
  prompt: string;
  project_info: string;
  expert_info: string;
  sample_output: string;
  generated_bio: string;
  created_at: string;
}

export function BIOHistoryDialog({ open, onClose, onSelect, userEmail }: BIOHistoryDialogProps) {
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [histories, setHistories] = useState<BIOHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const limit = 10;

  useEffect(() => {
    if (open) {
      handleSearch();
    }
  }, [open]);

  const loadHistories = async (page: number) => {
    setLoading(true);
    try {
      const { histories, count } = await searchBIOHistory(supabase, {
        page,
        limit,
        searchText,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        userEmail
      });
      setHistories(histories);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading histories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadHistories(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadHistories(newPage);
  };

  const handleSelect = (history: BIOHistoryItem) => {
    onSelect(history);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>BIO History</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-8"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[130px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PP") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[130px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PP") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="space-y-2">
            {histories.map((history) => (
              <div
                key={history.id}
                className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => handleSelect(history)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">
                    {format(new Date(history.created_at), "PPpp")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {history.llm_type} - {history.language}
                  </div>
                </div>
                <div className="text-sm line-clamp-2">{history.project_info}</div>
                <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {history.expert_info}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Total: {totalCount} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page * limit >= totalCount}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 