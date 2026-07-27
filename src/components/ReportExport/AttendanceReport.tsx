import { useState } from "react"
import { useReport } from "../contexts/ReportDataContext";

const AttendanceReport = () => {

    const {fetchReport ,loading , fetchExportToExcel , fetchExportToPdf} = useReport();

    // drop down 

    const [academicYear , setAcademicYear] = useState<any[]>([]);
    const [term , setTerm] = useState<any[]>([]);
    const [classes , setClases] = useState<any[]>([]);


    
    // selected filter

    const [selectAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
    const [selectTerm, setSelectedTerm] = useState<number | null>(null);
    const [selectClasses, setSelectedClasses] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string >("");



    return(
        <div className="w-full bg-[#f3f4f6] h-auto flex flex-col justify-center items-center p-10">
            <div className="w-[1216px] h-[211px] rounded-sm bg-[#ffffff] border-1 border-gray-300 p-6">
                
                <div className="flex gap-3 items-center font-bold pb-3 mb-3">
                    <svg width="20" height="20" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.33309 12.3333C6.33304 12.4572 6.3675 12.5787 6.43262 12.6841C6.49774 12.7895 6.59094 12.8746 6.70176 12.93L8.03509 13.5967C8.13676 13.6475 8.24972 13.6714 8.36326 13.6663C8.47679 13.6612 8.58712 13.6271 8.68378 13.5673C8.78044 13.5075 8.8602 13.424 8.91551 13.3247C8.97081 13.2254 8.99981 13.1137 8.99976 13V8.33333C8.99991 8.00292 9.12274 7.68433 9.34443 7.43933L14.1598 2.11333C14.2461 2.01771 14.3028 1.89912 14.3232 1.77192C14.3435 1.64472 14.3265 1.51435 14.2744 1.39658C14.2222 1.27881 14.137 1.17868 14.0291 1.1083C13.9212 1.03792 13.7952 1.0003 13.6664 1H1.66643C1.5375 1.00005 1.41135 1.03748 1.30326 1.10776C1.19517 1.17804 1.10978 1.27815 1.05743 1.39598C1.00508 1.5138 0.988017 1.64427 1.00831 1.77159C1.0286 1.89892 1.08538 2.01762 1.17176 2.11333L5.98843 7.43933C6.21012 7.68433 6.33294 8.00292 6.33309 8.33333V12.3333Z" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Report Configuration
                </div>

                <div className="w-full h-[62px] ">
                    <form action="" className="w-full h-[62px] flex flex-col gap-3">

                        <div className="w-[1166px] h-[62px]  flex justify-between">
                            <div className="w-[220.39px] h-[62px]">
                                <label className="font-bold text-gray-600 ">Start Date</label>
                                <input type="date" name="start_date" id="start_date" className="w-[220.39px] h-[40px] bg-[#F9FAFB] border border-[#D1D5DB] focus:border-0 focus:outline-0 p-2" />
                            </div>

                            <div className="w-[220.39px] h-[62px]">
                                <label className="font-bold text-gray-600 ">End Date</label>
                                <input type="date" name="end_date" id="end_date" className="w-[220.39px] h-[40px] bg-[#F9FAFB] border border-[#D1D5DB] focus:border-0 focus:outline-0 p-2" />
                            </div>

                            <div className="w-[220.39px] h-[62px]">
                                <label className="font-bold text-gray-600 ">Academic Year</label>
                                <select name="" id="academic_year" className="w-[220.39px] h-[40px] bg-[#F9FAFB] border border-[#D1D5DB] focus:border-0 focus:outline-0 p-2">
                                    <option value="">

                                    </option>
                                </select>
                            </div>


                            <div className="w-[220.39px] h-[62px]">
                                <label className="font-bold text-gray-600 ">Term</label>
                                <select name="" id="term" className="w-[220.39px] h-[40px] bg-[#F9FAFB] border border-[#D1D5DB] focus:border-0 focus:outline-0 p-2">
                                    <option value="">

                                    </option>
                                </select>
                            </div>


                            <div className="w-[220.39px] h-[62px]">
                                <label className="font-bold text-gray-600 ">Class</label>
                                <select name="" id="class" className="w-[220.39px] h-[40px] bg-[#F9FAFB] border border-[#D1D5DB] focus:border-0 focus:outline-0 p-2">
                                    <option value="">
                                
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="w-[1166px] h-[62px]  flex justify-end">
                            <button type="submit" className="w-[162.78px] h-[38px] rounded-sm flex items-center text-sm justify-around p-3 bg-[#1E293B] text-white">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5.33325 1.33333V3.99999" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M10.6667 1.33333V3.99999" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26363 2 4.00001V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4.00001C14 3.26363 13.403 2.66667 12.6667 2.66667Z" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2 6.66667H14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>

                                Generate Report
                            </button>
                        </div>
                    </form>
                </div>
 
            </div>
            <div className="w-[1216px] h-auto pt-6 flex justify-between ">
                <div className="w-[230.40px] h-[100px] rounded-sm bg-[#ffffff] border-1 border-gray-300 flex justify-between items-center">
                    <div className="pl-3 ">
                        <p className="text-gray-500">Total Present</p>
                        <p className="text-3xl font-bold text-green-700">
                            123
                        </p>
                    </div>
                </div>
                <div className="w-[230.40px] h-[100px] rounded-sm bg-[#ffffff] border-1 border-gray-300 flex justify-between items-center">
                    <div className="pl-3 ">
                        <p className="text-gray-500">Total Permission</p>
                        <p className="text-3xl font-bold text-blue-700">
                            123
                        </p>
                    </div>                   
                </div>
                <div className="w-[230.40px] h-[100px] rounded-sm bg-[#ffffff] border-1 border-gray-300 flex justify-between items-center">
                    <div className="pl-3 ">
                        <p className="text-gray-500">Total Absent</p>
                        <p className="text-3xl font-bold text-red-700">
                            123
                        </p>
                    </div>                    
                </div>
            </div>
            {loading && <div>Loading...</div>}
        </div>
    )
}

export default AttendanceReport