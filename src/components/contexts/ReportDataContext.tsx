import { createContext, useContext, useState } from "react"
import { request } from "../utils/Request"



export interface FilterReport {
    date_from : string,
    date_to : string,
    academic_year_id : number,
    term_id : number,
    class_id : number
}

export interface ReportRow {
    student_code : string ,
    name : string ,
    class_name : string ,
    present : number ,
    absent : number ,
    permission : number
}


export interface ReportData {
    filter : FilterReport,
    period: {from :string , to:string},
    term_name: string,
    class_name: string,
    rows: ReportData [],
    totals:{
        present : number ,
        absent : number ,
        permission : number
    }
}

export interface ReportContextType {
    report: ReportData | null,
    loading : boolean,
    error : string | null,
    fetchReport : (filter : FilterReport) => Promise <void>,
    fetchExportToPdf : (filter : FilterReport) => Promise <void>,
    fetchExportToExcel : (filter : FilterReport) => Promise <void>
}

export const ReportContext = createContext<ReportContextType | null> (null);


export const ReportProvider = ({children}:{children :React.ReactNode}) => {

    const [report , setReport] = useState<ReportData | null>(null);
    const [loading , setLoading] = useState(false);
    const [error , setError] = useState<string | null>(null);
    const [pdf , setPdf] = useState<File | null> (null);
    const [excel , setExcel] = useState<File | null> (null);
    const fetchReport = async (filter: FilterReport) => {
        setLoading(true);
        setError(null);
        try{
            const data = await request('/report-export/report-data' , 'POST' ,  { ...filter } );
            setReport(data)
        }catch(err: any){
            setError(err?.message  || 'Something went wrong');
        }finally{
            setLoading(false)
        }
    }

    const fetchExportToPdf =async (filter :FilterReport) => {
        setLoading(true);
        setError(null);
        try{
            const data = await request('/report-export/pdf' , 'POST' , {...filter});
            setPdf(data);
        }catch(err : any) {
            setError(err?.message || 'Something went wrong');
        }finally{
            setLoading(false);
        }
    }
    const fetchExportToExcel =async (filter :FilterReport) => {
        setLoading(true);
        setError(null);
        try{
            const data = await request('/report-export/pdf' , 'POST' , {...filter});
            setExcel(data);
        }catch(err : any) {
            setError(err?.message || 'Something went wrong');
        }finally{
            setLoading(false);
        }
    }

    return (
        <ReportContext.Provider value={{report , loading , error , fetchReport , fetchExportToExcel , fetchExportToPdf}}>
            {children}
        </ReportContext.Provider>
    )
}

export const useReport = () => {
    const context = useContext(ReportContext);

    if(!context) {
        throw new Error("useReport must be used inside ReportProvider ");
    }

    return context;
}
