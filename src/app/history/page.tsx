import { getHistory } from "@/app/actions";
import { CheckCircle2, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

export default async function HistoryPage() {
  const history = await getHistory();

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 min-h-screen">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">History Log</h1>
        <p className="text-gray-500">Past cleaning records</p>
      </div>

      <div className="flex flex-col gap-4">
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <p>No history yet.</p>
          </div>
        ) : (
          history.map((record) => (
            <div 
              key={record.id} 
              className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex items-start gap-4"
            >
              <div className="bg-green-100 text-green-600 p-3 rounded-2xl shrink-0 mt-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">{record.user}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(record.date), "MMM d, yyyy")}
                  </div>
                </div>
                <p className="text-sm font-medium text-blue-600">{record.chores}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Completed at {format(parseISO(record.completedAt), "h:mm a")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
