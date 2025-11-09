'use client';

import { useState } from 'react';

export default function TestScenariosPage() {
  const [cheatCodeId, setCheatCodeId] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const deleteScenarios = async () => {
    if (!cheatCodeId) {
      setResult('Please enter a cheat code ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/game/debug-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_scenarios',
          cheat_code_id: cheatCodeId,
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getCheatCodeContent = async () => {
    if (!cheatCodeId) {
      setResult('Please enter a cheat code ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/game/debug-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_cheat_code_content',
          cheat_code_id: cheatCodeId,
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-8">Test Scenario Generation</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Cheat Code ID
            </label>
            <input
              type="text"
              value={cheatCodeId}
              onChange={(e) => setCheatCodeId(e.target.value)}
              placeholder="Paste cheat code ID here"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              To get the ID: Go to My Codes, open a code card, and check the browser console for the ID in the logs
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={getCheatCodeContent}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
            >
              View Cheat Code Content
            </button>

            <button
              onClick={deleteScenarios}
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50"
            >
              Delete All Scenarios
            </button>
          </div>

          {result && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Result:</h2>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-auto max-h-96 text-sm">
                {result}
              </pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              <li>Go to My Codes page and click on a cheat code</li>
              <li>Open browser console (F12 or Cmd+Option+I)</li>
              <li>Look for the cheat code ID in the console logs</li>
              <li>Copy the ID and paste it above</li>
              <li>Click "View Cheat Code Content" to see how it's stored in the database</li>
              <li>Click "Delete All Scenarios" to clear scenarios and allow regeneration</li>
              <li>Go back to the cheat code card and click "Practice" to regenerate scenarios</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
