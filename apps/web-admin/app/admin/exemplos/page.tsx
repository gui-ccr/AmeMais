import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";

export default function ExemplosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-light">Componentes Estruturais</h1>
        <p className="text-muted-foreground mt-2">
          Página de demonstração dos componentes Card e Modal para validar o Design System.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Demonstração do Card</CardTitle>
            <CardDescription>
              Este é o componente Card completo, contendo um cabeçalho, um conteúdo e um rodapé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              O conteúdo flexível pode receber listagens, dados de animais ou qualquer estrutura.
              As margens são tratadas automaticamente pelo design system.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <button className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary-hover transition-colors font-medium text-sm">
              Cancelar
            </button>
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-dark transition-colors font-medium text-sm">
              Salvar
            </button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações com Modal</CardTitle>
            <CardDescription>
              Exemplo de interação entre o Card e o Modal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              O modal (Dialog) é utilizado para exibir alertas ou formulários sem sair da página.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Modal>
              <ModalTrigger asChild>
                <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-dark transition-colors font-medium text-sm shadow-sm">
                  Abrir Modal
                </button>
              </ModalTrigger>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>Você tem certeza?</ModalTitle>
                  <ModalDescription>
                    Esta é uma ação demonstrativa. O modal foca automaticamente e bloqueia a tela ao fundo.
                  </ModalDescription>
                </ModalHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    O usuário pode clicar fora, apertar ESC ou clicar no X acima para fechar.
                  </p>
                </div>
                <ModalFooter>
                  <ModalClose asChild>
                    <button className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary-hover transition-colors font-medium text-sm">
                      Cancelar
                    </button>
                  </ModalClose>
                  <ModalClose asChild>
                    <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-dark transition-colors font-medium text-sm shadow-sm">
                      Confirmar Ação
                    </button>
                  </ModalClose>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
