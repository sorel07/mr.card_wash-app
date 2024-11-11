import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  ActivityIndicator,
  SectionList,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  ScrollView
} from "react-native";
import { HelloWave } from "@/components/HelloWave";
import { ThemedView } from "@/components/ThemedView";

interface Cliente {
  Cedula: number;
  Nombre: string;
  Telefono: string;
  Direccion: string;
}

interface Vehiculo {
  Placa: string;
  Marca: string;
  Modelo: string;
  Color: string;
  Cedula_Cliente: number;
}

interface ServicioCarWash {
  id: number;
  Nombre: string;
  Descripcion: string;
  Tarifa: number;
}

interface VehiculoServicio {
  id: number;
  Placa_Vehiculo: string;
  Servicio_id: number;
  Fecha_Servicio: string;
  Facturado?: boolean;
}

interface FacturaCarWash {
  id: number;
  Cedula_Cliente: number;
  Placa_Vehiculo: string;
  Servicios: {
    Servicio_id: number;
    Nombre: string;
    Tarifa: number;
  }[];
  Total: number;
  Fecha_Factura: string;
}

type SectionData = {
  title: string;
  data: Array<Cliente | Vehiculo | FacturaCarWash>;
};

export default function HomeScreen() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [servicios, setServicios] = useState<ServicioCarWash[]>([]);
  const [facturas, setFacturas] = useState<FacturaCarWash[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentCliente, setCurrentCliente] = useState<Cliente | null>(null);
  const [currentVehiculo, setCurrentVehiculo] = useState<Vehiculo | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [modalType, setModalType] = useState<
    "cliente" | "vehiculo" | "servicio" | null
  >(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showClienteList, setShowClienteList] = useState<boolean>(false);
  const [selectedServicios, setSelectedServicios] = useState<number[]>([]);
  const [currentFactura, setCurrentFactura] = useState<FacturaCarWash | null>(
    null
  );
  const [isFacturaModalVisible, setIsFacturaModalVisible] = useState<boolean>(
    false
  );

  const fetchData = async () => {
    try {
      const [
        clientesRes,
        vehiculosRes,
        serviciosRes,
        facturasRes
      ] = await Promise.all([
        fetch("https://mr-carwash-api.onrender.com/api/clientes"),
        fetch("https://mr-carwash-api.onrender.com/api/vehiculos"),
        fetch("https://mr-carwash-api.onrender.com/api/servicios_car_wash"),
        fetch("https://mr-carwash-api.onrender.com/api/facturas_car_wash")
      ]);

      if (
        !clientesRes.ok ||
        !vehiculosRes.ok ||
        !serviciosRes.ok ||
        !facturasRes.ok
      ) {
        throw new Error("Error al obtener los datos");
      }

      const clientesData: Cliente[] = await clientesRes.json();
      const vehiculosData: Vehiculo[] = await vehiculosRes.json();
      const serviciosData: ServicioCarWash[] = await serviciosRes.json();
      const facturasData: FacturaCarWash[] = await facturasRes.json();

      setClientes(clientesData);
      setVehiculos(vehiculosData);
      setServicios(serviciosData);
      setFacturas(facturasData);

      setSections([
        { title: "Clientes", data: clientesData },
        { title: "Vehiculos", data: vehiculosData },
        { title: "Facturas", data: facturasData }
      ]);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderCliente = (cliente: Cliente) => (
    <ThemedView style={styles.itemContainer}>
      <Text style={styles.nombre}>{cliente.Nombre}</Text>
      <Text>Cédula: {cliente.Cedula}</Text>
      <Text>Teléfono: {cliente.Telefono}</Text>
      <Text>Dirección: {cliente.Direccion}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleEditCliente(cliente)}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleDeleteCliente(cliente.Cedula)}
        >
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderVehiculo = (vehiculo: Vehiculo) => {
    const cliente = clientes.find((c) => c.Cedula === vehiculo.Cedula_Cliente);

    return (
      <ThemedView style={styles.itemContainer}>
        <Text style={styles.marca}>
          {vehiculo.Marca} - {vehiculo.Modelo}
        </Text>
        <Text>Placa: {vehiculo.Placa}</Text>
        <Text>Color: {vehiculo.Color}</Text>
        <Text>Propietario: {cliente ? cliente.Nombre : "Sin asignar"}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleAssignService(vehiculo)}
          >
            <Text style={styles.buttonText}>Asignar Servicio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleGenerateInvoice(vehiculo)}
          >
            <Text style={styles.buttonText}>Generar Factura</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleEditVehiculo(vehiculo)}
          >
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleDeleteVehiculo(vehiculo.Placa)}
          >
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };

  const renderFactura = (factura: FacturaCarWash) => {
    const cliente = clientes.find((c) => c.Cedula === factura.Cedula_Cliente);

    return (
      <ThemedView style={styles.itemContainer}>
        <Text style={styles.titulo}>Factura ID: {factura.id}</Text>
        <Text>Cliente: {cliente ? cliente.Nombre : factura.Cedula_Cliente}</Text>
        <Text>Vehículo: {factura.Placa_Vehiculo}</Text>
        <Text>Fecha: {factura.Fecha_Factura}</Text>
        <Text>Total: ${factura.Total}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setCurrentFactura(factura);
            setIsFacturaModalVisible(true);
          }}
        >
          <Text style={styles.buttonText}>Ver Detalles</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  };

  const handleDeleteCliente = (cedula: number) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de eliminar este cliente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteCliente(cedula)
        }
      ]
    );
  };

  const deleteCliente = async (cedula: number) => {
    try {
      const response = await fetch(
        `https://mr-carwash-api.onrender.com/api/clientes/${cedula}`,
        {
          method: "DELETE"
        }
      );
      if (!response.ok) {
        throw new Error("Error al eliminar el cliente");
      }
      fetchData(); // Actualizar la lista
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteVehiculo = (placa: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de eliminar este vehículo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteVehiculo(placa)
        }
      ]
    );
  };

  const deleteVehiculo = async (placa: string) => {
    try {
      const response = await fetch(
        `https://mr-carwash-api.onrender.com/api/vehiculos/${placa}`,
        {
          method: "DELETE"
        }
      );
      if (!response.ok) {
        throw new Error("Error al eliminar el vehículo");
      }
      fetchData(); // Actualizar la lista
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleAddCliente = () => {
    setCurrentCliente({
      Cedula: 0,
      Nombre: "",
      Telefono: "",
      Direccion: ""
    });
    setIsEditing(false);
    setModalType("cliente");
    setIsModalVisible(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    setCurrentCliente(cliente);
    setIsEditing(true);
    setModalType("cliente");
    setIsModalVisible(true);
  };

  const handleAddVehiculo = () => {
    setCurrentVehiculo({
      Placa: "",
      Marca: "",
      Modelo: "",
      Color: "",
      Cedula_Cliente: 0
    });
    setSelectedCliente(null);
    setIsEditing(false);
    setModalType("vehiculo");
    setIsModalVisible(true);
  };

  const handleEditVehiculo = (vehiculo: Vehiculo) => {
    setCurrentVehiculo(vehiculo);
    const cliente = clientes.find((c) => c.Cedula === vehiculo.Cedula_Cliente);
    setSelectedCliente(cliente || null);
    setIsEditing(true);
    setModalType("vehiculo");
    setIsModalVisible(true);
  };

  const handleSaveCliente = async () => {
    if (!currentCliente) return;

    if (
      !currentCliente.Cedula ||
      !currentCliente.Nombre ||
      !currentCliente.Telefono ||
      !currentCliente.Direccion
    ) {
      Alert.alert("Error", "Por favor, completa todos los campos");
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `https://mr-carwash-api.onrender.com/api/clientes/${currentCliente.Cedula}`
      : "https://mr-carwash-api.onrender.com/api/clientes";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(currentCliente)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            (isEditing
              ? "Error al actualizar el cliente"
              : "Error al crear el cliente")
        );
      }
      setIsModalVisible(false);
      fetchData(); // Actualizar la lista
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSaveVehiculo = async () => {
    if (!currentVehiculo) return;

    if (
      !currentVehiculo.Placa ||
      !currentVehiculo.Marca ||
      !currentVehiculo.Modelo ||
      !currentVehiculo.Color ||
      !selectedCliente
    ) {
      Alert.alert("Error", "Por favor, completa todos los campos");
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `https://mr-carwash-api.onrender.com/api/vehiculos/${currentVehiculo.Placa}`
      : "https://mr-carwash-api.onrender.com/api/vehiculos";

    const vehiculoData = {
      ...currentVehiculo,
      Cedula_Cliente: selectedCliente.Cedula
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(vehiculoData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            (isEditing
              ? "Error al actualizar el vehículo"
              : "Error al crear el vehículo")
        );
      }
      setIsModalVisible(false);
      fetchData(); // Actualizar la lista
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleAssignService = (vehiculo: Vehiculo) => {
    setCurrentVehiculo(vehiculo);
    setSelectedServicios([]);
    setModalType("servicio");
    setIsModalVisible(true);
  };

  const handleSaveServicio = async () => {
    if (!currentVehiculo || selectedServicios.length === 0) {
      Alert.alert("Error", "Selecciona al menos un servicio");
      return;
    }

    try {
      for (const servicioId of selectedServicios) {
        const response = await fetch(
          `https://mr-carwash-api.onrender.com/api/vehiculos/${currentVehiculo.Placa}/servicios`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              Servicio_id: servicioId,
              Fecha_Servicio: new Date().toISOString()
            })
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al asignar el servicio");
        }
      }
      setIsModalVisible(false);
      Alert.alert("Éxito", "Servicios asignados correctamente");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleGenerateInvoice = async (vehiculo: Vehiculo) => {
    try {
      const response = await fetch(
        "https://mr-carwash-api.onrender.com/api/facturas_car_wash",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            Cedula_Cliente: vehiculo.Cedula_Cliente,
            Placa_Vehiculo: vehiculo.Placa
          })
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al generar la factura");
      }
      const factura: FacturaCarWash = await response.json();
      setCurrentFactura(factura);
      setIsFacturaModalVisible(true);
      fetchData(); // Actualizar datos
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const renderItem = ({
    item,
    section
  }: {
    item: Cliente | Vehiculo | FacturaCarWash;
    section: SectionData;
  }) => {
    if (section.title === "Clientes") {
      return renderCliente(item as Cliente);
    } else if (section.title === "Vehiculos") {
      return renderVehiculo(item as Vehiculo);
    } else if (section.title === "Facturas") {
      return renderFactura(item as FacturaCarWash);
    }
    return null;
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      {section.title === "Clientes" && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddCliente}>
          <Text style={styles.addButtonText}>Agregar Cliente</Text>
        </TouchableOpacity>
      )}
      {section.title === "Vehiculos" && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddVehiculo}>
          <Text style={styles.addButtonText}>Agregar Vehículo</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderClienteItem = ({ item }: { item: Cliente }) => (
    <TouchableOpacity
      style={styles.clienteItem}
      onPress={() => {
        setSelectedCliente(item);
        setShowClienteList(false);
      }}
    >
      <Text>{item.Nombre}</Text>
      <Text>Cédula: {item.Cedula}</Text>
    </TouchableOpacity>
  );

  const renderServicioItem = ({ item }: { item: ServicioCarWash }) => (
    <TouchableOpacity
      style={styles.servicioItem}
      onPress={() => {
        setSelectedServicios((prev) => {
          if (prev.includes(item.id)) {
            return prev.filter((id) => id !== item.id);
          } else {
            return [...prev, item.id];
          }
        });
      }}
    >
      <Text>{item.Nombre}</Text>
      <Text>Tarifa: ${item.Tarifa}</Text>
      {selectedServicios.includes(item.id) && (
        <Text style={styles.selectedText}>Seleccionado</Text>
      )}
    </TouchableOpacity>
  );

  const renderFacturaServicios = (factura: FacturaCarWash) => (
    <FlatList
      data={factura.Servicios}
      keyExtractor={(item) => item.Servicio_id.toString()}
      renderItem={({ item }) => (
        <View style={styles.facturaServicioItem}>
          <Text>{item.Nombre}</Text>
          <Text>Tarifa: ${item.Tarifa}</Text>
        </View>
      )}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header con Imagen y Título */}
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/logo-car_wash.jpg")}
          style={styles.reactLogo}
          resizeMode="contain"
        />
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Mr CarWash & Parking</Text>
          <HelloWave />
        </View>
      </View>

      {/* Contenido Principal */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) =>
            "Cedula" in item
              ? (item as Cliente).Cedula.toString()
              : "id" in item
              ? (item as FacturaCarWash).id.toString()
              : (item as Vehiculo).Placa.toString()
          }
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal para agregar y editar */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {modalType === "cliente" && (
              <>
                <Text style={styles.modalTitle}>
                  {isEditing ? "Editar Cliente" : "Agregar Cliente"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cédula"
                  value={
                    currentCliente?.Cedula
                      ? currentCliente.Cedula.toString()
                      : ""
                  }
                  onChangeText={(text) =>
                    setCurrentCliente((prev) => ({
                      ...prev!,
                      Cedula: parseInt(text) || 0
                    }))
                  }
                  keyboardType="numeric"
                  editable={!isEditing}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={currentCliente?.Nombre || ""}
                  onChangeText={(text) =>
                    setCurrentCliente((prev) => ({ ...prev!, Nombre: text }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  value={currentCliente?.Telefono || ""}
                  onChangeText={(text) =>
                    setCurrentCliente((prev) => ({
                      ...prev!,
                      Telefono: text
                    }))
                  }
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Dirección"
                  value={currentCliente?.Direccion || ""}
                  onChangeText={(text) =>
                    setCurrentCliente((prev) => ({ ...prev!, Direccion: text }))
                  }
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleSaveCliente}
                  >
                    <Text style={styles.modalButtonText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {modalType === "vehiculo" && (
              <>
                <Text style={styles.modalTitle}>
                  {isEditing ? "Editar Vehículo" : "Agregar Vehículo"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Placa"
                  value={currentVehiculo?.Placa || ""}
                  onChangeText={(text) =>
                    setCurrentVehiculo((prev) => ({
                      ...prev!,
                      Placa: text
                    }))
                  }
                  editable={!isEditing}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Marca"
                  value={currentVehiculo?.Marca || ""}
                  onChangeText={(text) =>
                    setCurrentVehiculo((prev) => ({ ...prev!, Marca: text }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Modelo"
                  value={currentVehiculo?.Modelo || ""}
                  onChangeText={(text) =>
                    setCurrentVehiculo((prev) => ({
                      ...prev!,
                      Modelo: text
                    }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Color"
                  value={currentVehiculo?.Color || ""}
                  onChangeText={(text) =>
                    setCurrentVehiculo((prev) => ({ ...prev!, Color: text }))
                  }
                />
                <TouchableOpacity
                  style={styles.selectClienteButton}
                  onPress={() => setShowClienteList(true)}
                >
                  <Text style={styles.selectClienteButtonText}>
                    {selectedCliente
                      ? `Cliente: ${selectedCliente.Nombre}`
                      : "Seleccionar Cliente"}
                  </Text>
                </TouchableOpacity>

                {showClienteList && (
                  <FlatList
                    data={clientes}
                    keyExtractor={(item) => item.Cedula.toString()}
                    renderItem={renderClienteItem}
                    style={styles.clienteList}
                  />
                )}

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleSaveVehiculo}
                  >
                    <Text style={styles.modalButtonText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setIsModalVisible(false);
                      setShowClienteList(false);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {modalType === "servicio" && (
              <>
                <Text style={styles.modalTitle}>Asignar Servicios</Text>
                <FlatList
                  data={servicios}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderServicioItem}
                  style={styles.servicioList}
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleSaveServicio}
                  >
                    <Text style={styles.modalButtonText}>Asignar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setIsModalVisible(false);
                      setSelectedServicios([]);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal para mostrar factura */}
      <Modal
        visible={isFacturaModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFacturaModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {currentFactura && (
              <>
                <Text style={styles.modalTitle}>Factura</Text>
                <Text>Factura ID: {currentFactura.id}</Text>
                <Text>Cliente: {currentFactura.Cedula_Cliente}</Text>
                <Text>Vehículo: {currentFactura.Placa_Vehiculo}</Text>
                <Text>Fecha: {currentFactura.Fecha_Factura}</Text>
                <Text style={styles.sectionHeaderText}>Servicios:</Text>
                {renderFacturaServicios(currentFactura)}
                <Text style={styles.totalText}>
                  Total: ${currentFactura.Total}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsFacturaModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  header: {
    backgroundColor: "#A1CEDC",
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  reactLogo: {
    height: 100,
    width: 300,
    marginBottom: 10
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 10
  },
  loader: {
    marginTop: 20
  },
  errorText: {
    color: "red",
    padding: 16,
    textAlign: "center"
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  sectionHeader: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    borderRadius: 8
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "bold"
  },
  itemContainer: {
    backgroundColor: "#e0f7fa",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8
  },
  nombre: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4
  },
  marca: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4
  },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
    marginTop: 5
  },
  buttonText: {
    color: "#fff"
  },
  addButton: {
    backgroundColor: "#28A745",
    padding: 8,
    borderRadius: 5,
    marginTop: 10
  },
  addButtonText: {
    color: "#fff",
    textAlign: "center"
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalContent: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
    maxHeight: "80%"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  modalButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5
  },
  modalButtonText: {
    color: "#fff",
    textAlign: "center"
  },
  selectClienteButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
  },
  selectClienteButtonText: {
    color: "#fff",
    textAlign: "center"
  },
  clienteList: {
    maxHeight: 150,
    marginBottom: 10
  },
  clienteItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc"
  },
  servicioList: {
    maxHeight: 200,
    marginBottom: 10
  },
  servicioItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc"
  },
  selectedText: {
    color: "green",
    fontWeight: "bold"
  },
  facturaServicioItem: {
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc"
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center"
  },
  modalCloseButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center"
  }
});
