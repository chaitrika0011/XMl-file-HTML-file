import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Calendar, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { supabase } from './lib/supabase';

interface Todo {
  id: string;
  title: string;
  description: string;
  is_completed: boolean;
  due_date: string | null;
  priority: string;
  created_at: string;
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchTodos();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchTodos();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchTodos() {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      toast.error('Error loading todos');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      toast.success('Signed in successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  function validatePassword(value: string) {
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!validatePassword(password)) {
      return;
    }
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
      toast.success('Check your email to confirm your account!');
      setAuthMode('signin');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('todos').insert([{
        ...newTodo,
        user_id: session.user.id
      }]);
      
      if (error) throw error;
      
      setNewTodo({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium'
      });
      
      toast.success('Todo added successfully!');
      fetchTodos();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function toggleTodo(id: string, is_completed: boolean) {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: !is_completed })
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function deleteTodo(id: string) {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Todo deleted successfully!');
      fetchTodos();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-3xl font-bold text-center mb-8">Todo App</h2>
          <div className="space-y-6">
            {authMode === 'signin' ? (
              <>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Sign In
                  </button>
                </form>
                <div className="text-center">
                  <span className="text-gray-500">Don't have an account?</span>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="block w-full mt-2 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <div className="space-y-1">
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                        passwordError ? 'border-red-500' : ''
                      }`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        validatePassword(e.target.value);
                      }}
                      required
                    />
                    {passwordError && (
                      <p className="text-red-500 text-sm">{passwordError}</p>
                    )}
                    <p className="text-gray-500 text-sm">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    Sign Up
                  </button>
                </form>
                <div className="text-center">
                  <span className="text-gray-500">Already have an account?</span>
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setPassword('');
                      setPasswordError('');
                    }}
                    className="block w-full mt-2 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Sign In Instead
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Todos</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-white text-purple-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <form onSubmit={handleAddTodo} className="bg-white p-6 rounded-lg shadow-xl mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              placeholder="Todo title"
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              placeholder="Description"
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="datetime-local"
              value={newTodo.due_date}
              onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={newTodo.priority}
              onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Todo
          </button>
        </form>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-white">Loading todos...</div>
          ) : todos.length === 0 ? (
            <div className="text-center text-white">No todos yet. Add one above!</div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white p-6 rounded-lg shadow-xl transition-all ${
                  todo.is_completed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => toggleTodo(todo.id, todo.is_completed)}
                      className={`mt-1 ${
                        todo.is_completed ? 'text-green-500' : 'text-gray-400'
                      }`}
                    >
                      {todo.is_completed ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Circle size={24} />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3
                        className={`text-xl font-semibold ${
                          todo.is_completed ? 'line-through text-gray-500' : ''
                        }`}
                      >
                        {todo.title}
                      </h3>
                      <p className="text-gray-600 mt-1">{todo.description}</p>
                      {todo.due_date && (
                        <div className="flex items-center gap-2 text-gray-500 mt-2">
                          <Calendar size={16} />
                          {new Date(todo.due_date).toLocaleString()}
                        </div>
                      )}
                      <div className="mt-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-sm ${
                            todo.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : todo.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;