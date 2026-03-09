"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { extractUserInfo, onGoogleAuthStateChanged } from "@/lib/gmail-auth";
import convex from "@/lib/convex";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Suspense } from "react";

interface QuizResult {
    name: string;
    email: string;
    score: number;
    correct: number;
    total: number;
    submittedAt: number;
}

function QuizResultsContent() {
    const searchParams = useSearchParams();
    const quizId = searchParams.get('id') as string;
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [results, setResults] = useState<QuizResult[]>([]);
    const [quizTitle, setQuizTitle] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    const loadResults = async (firebaseUid: string, id: string) => {
        if (!id) return;
        try {
            console.log("Loading results for quiz:", id, "with uid:", firebaseUid);
            const dbResults = await convex.query("admin:getQuizResults" as any, {
                firebaseUid,
                quizId: id
            });
            console.log("Received results from database:", dbResults);

            // Temporary check of all submissions just to see if they exist anywhere
            try {
                const allSubmissions = await convex.query("admin:getAllSubmissionsDebug" as any);
                console.log("ALL SUBMISSIONS IN DB:", allSubmissions);

                const allQuizSubmissions = await convex.query("admin:getSubmissionsDebug" as any, { quizId: id });
                console.log("ALL SUBMISSIONS FOR THIS QUIZ (No Auth Check):", allQuizSubmissions);
            } catch (err) {
                console.error("Debug queries failed", err);
            }

            // Handle new response structure
            if (dbResults && dbResults.results) {
                setResults(dbResults.results || []);
                setQuizTitle(dbResults.quiz?.title || "Quiz Results");
            } else {
                // Fallback for old structure (if needed)
                setResults(dbResults || []);
                setQuizTitle("Quiz Results");
            }

            setIsLoading(false);
        } catch (error) {
            console.error("Failed to load results:", error);
            setIsLoading(false);
        }
    };

    // Load user and results
    useEffect(() => {
        const unsubscribe = onGoogleAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                const userInfo = extractUserInfo(firebaseUser);
                setUser(userInfo);
                if (quizId) {
                    loadResults(userInfo.uid, quizId);
                }
            } else {
                router.push("/admin");
            }
        });

        return () => unsubscribe();
    }, [quizId]);

    const exportToExcel = () => {
        const data = results.map(r => ({
            Name: r.name,
            Email: r.email,
            Score: `${r.correct}/${r.total}`,
            Percentage: `${r.score}%`,
            'Submitted At': new Date(r.submittedAt).toLocaleString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
        XLSX.writeFile(workbook, `${quizTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_')}_Results.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.text(`${quizTitle} Results`, 14, 15);

        const tableColumn = ["Name", "Email", "Score", "Percentage", "Submitted At"];
        const tableRows = results.map(r => [
            r.name,
            r.email,
            `${r.correct}/${r.total}`,
            `${r.score}%`,
            new Date(r.submittedAt).toLocaleString(),
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save(`${quizTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_')}_Results.pdf`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-ns-gray-50 flex items-center justify-center">
                <div className="ns-card text-center">
                    <div className="w-8 h-8 border-2 border-ns-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="ns-body-text">Loading results...</span>
                </div>
            </div>
        );
    }

    if (!quizId) {
        return (
            <div className="min-h-screen bg-ns-gray-50 flex items-center justify-center">
                <div className="ns-card text-center">
                    <span className="ns-body-text text-red-600">No quiz ID provided</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ns-gray-50">
            <header className="bg-ns-white border-b border-ns-gray-200">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center space-x-4">
                        <Link href="/admin/dashboard" className="text-ns-gray-500 hover:text-ns-primary transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="ns-heading-1 mb-0">{quizTitle}</h1>
                            <p className="ns-caption text-ns-gray-400 mt-1">View and export participant scores</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="ns-heading-2">Participant Submissions ({results.length})</h2>
                    <div className="flex space-x-3">
                        <button
                            onClick={exportToExcel}
                            className="ns-button-secondary flex items-center space-x-2"
                            disabled={results.length === 0}
                        >
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            <span>Export Excel</span>
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="ns-button-secondary flex items-center space-x-2"
                            disabled={results.length === 0}
                        >
                            <FileText className="w-4 h-4 text-red-600" />
                            <span>Export PDF</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-ns-gray-200 overflow-hidden">
                    {results.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="ns-body-text text-ns-gray-500">No submissions yet for this quiz.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-ns-gray-50 border-b border-ns-gray-200 text-ns-gray-500 text-sm">
                                        <th className="px-6 py-4 font-medium">Name</th>
                                        <th className="px-6 py-4 font-medium">Email</th>
                                        <th className="px-6 py-4 font-medium">Score</th>
                                        <th className="px-6 py-4 font-medium">Percentage</th>
                                        <th className="px-6 py-4 font-medium">Submitted At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ns-gray-200">
                                    {results.map((r, i) => (
                                        <tr key={i} className="hover:bg-ns-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-ns-gray-900">{r.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-ns-gray-600">{r.email}</td>
                                            <td className="px-6 py-4 font-medium">
                                                {r.correct} / {r.total}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.score >= 80 ? 'bg-green-100 text-green-800' :
                                                    r.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {r.score}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-ns-gray-500 text-sm">
                                                {new Date(r.submittedAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function QuizResultsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-ns-gray-50 flex items-center justify-center">
                <div className="ns-card text-center">
                    <div className="w-8 h-8 border-2 border-ns-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="ns-body-text">Loading...</span>
                </div>
            </div>
        }>
            <QuizResultsContent />
        </Suspense>
    );
}
