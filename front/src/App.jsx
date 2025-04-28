import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">GameUnite</h1>
          <p className="text-blue-100">Plataforma de anúncios de jogos</p>
        </div>
      </header>
      <main className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Frontend Funcionando! 🚀
          </h2>
          <p className="text-gray-600 mb-4">
            O Vite está rodando corretamente com Tailwind CSS.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-100 p-4 rounded">
              <h3 className="font-semibold text-green-800">✅ React</h3>
              <p className="text-green-600">Funcionando</p>
            </div>
            <div className="bg-blue-100 p-4 rounded">
              <h3 className="font-semibold text-blue-800">✅ Vite</h3>
              <p className="text-blue-600">Funcionando</p>
            </div>
            <div className="bg-purple-100 p-4 rounded">
              <h3 className="font-semibold text-purple-800">✅ Tailwind</h3>
              <p className="text-purple-600">Funcionando</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
