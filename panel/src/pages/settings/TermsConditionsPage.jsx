import { BookOpen, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { WYSIWYGEditor } from '../../components/ui/WYSIWYGEditor';

const TermsConditionsPage = () => {
  const { addToast } = useToast();
  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <PageHeader 
        title="Terms & Conditions" 
        icon={BookOpen} 
        action={<Button onClick={() => addToast('Terms saved')} icon={Check}>Save Settings</Button>} 
      />
      <Card>
        <WYSIWYGEditor label="Terms Content" value="<h2>1. Introduction</h2><p>Welcome to our fireworks store...</p>" />
      </Card>
    </div>
  );
};

export default TermsConditionsPage;
