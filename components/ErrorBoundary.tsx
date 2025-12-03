
import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center z-50 relative">
            {/* Overlay background to ensure readability over the bricks */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />
            
            <div className="bg-gray-900/90 backdrop-blur-xl p-8 rounded-2xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] max-w-md w-full flex flex-col items-center gap-6 relative z-10 animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-red-500/10 rounded-full mb-2">
                    <AlertTriangle size={64} className="text-red-500 animate-pulse" />
                </div>
                
                <div>
                    <h1 className="text-3xl font-black text-white italic mb-2 tracking-wide">ERREUR SYSTÈME</h1>
                    <p className="text-gray-400 text-sm">Le jeu a rencontré un problème inattendu (probablement lors de la reprise).<br/>Ne t'inquiète pas, ta progression est sauvegardée.</p>
                </div>

                <button 
                    onClick={this.handleReload}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 group"
                >
                    <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-500"/>
                    RELANCER LE SYSTÈME
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
