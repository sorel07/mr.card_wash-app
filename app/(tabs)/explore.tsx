import { ThemedView } from "@/components/ThemedView";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList
} from "react-native";

interface TarifaParking {
  id: number;
  Tipo_Vehiculo: string;
  Hora: number;
  Fraccion: number;
}

interface ServicioCarWash {
  id: number;
  Nombre: string;
  Descripcion: string;
  Tarifa: number;
}

interface FacturaParking {
  id: number;
  Ticket_id: number;
  Tarifas_Parking_id: number;
  Hora_Salida: string;
  Total: number;
  Fecha_Factura: string;
}

type SectionData = {
  title: string;
  data: Array<TarifaParking | ServicioCarWash | FacturaParking>;
};

export default function ExploreScreen() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para modales y formularios
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentEntity, setCurrentEntity] = useState<
    "TarifaParking" | "ServicioCarWash" | null
  >(null);
  const [formData, setFormData] = useState<
    Partial<TarifaParking | ServicioCarWash>
  >({});

  const [facturasParking, setFacturasParking] = useState<FacturaParking[]>([]);

  const fetchData = async () => {
    try {
      const [tarifasRes, serviciosRes, facturasParkingRes] = await Promise.all([
        fetch("https://mr-carwash-api.onrender.com/api/tarifas_parking"),
        fetch("https://mr-carwash-api.onrender.com/api/servicios_car_wash"),
        fetch("https://mr-carwash-api.onrender.com/api/facturas_parking")
      ]);

      if (!tarifasRes.ok || !serviciosRes.ok || !facturasParkingRes.ok) {
        throw new Error("Error al obtener los datos");
      }

      const tarifas: TarifaParking[] = await tarifasRes.json();
      const servicios: ServicioCarWash[] = await serviciosRes.json();
      const facturasParkingData: FacturaParking[] =
        await facturasParkingRes.json();

      setFacturasParking(facturasParkingData);

      setSections([
        { title: "Tarifas de Parking", data: tarifas },
        { title: "Servicios de Car Wash", data: servicios },
        { title: "Facturas de Parking", data: facturasParkingData }
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

  // Funciones CRUD
  const handleAdd = (entity: "TarifaParking" | "ServicioCarWash") => {
    setCurrentEntity(entity);
    setFormData({});
    setModalVisible(true);
  };

  const handleEdit = (
    entity: "TarifaParking" | "ServicioCarWash",
    item: TarifaParking | ServicioCarWash
  ) => {
    setCurrentEntity(entity);
    setFormData(item);
    setModalVisible(true);
  };

  const handleDelete = (
    entity: "TarifaParking" | "ServicioCarWash",
    id: number
  ) => {
    Alert.alert(
      "Confirmar Eliminación",
      `¿Estás seguro de que deseas eliminar este ${
        entity === "TarifaParking" ? "Tarifa" : "Servicio"
      }?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const endpoint =
                entity === "TarifaParking"
                  ? `https://mr-carwash-api.onrender.com/api/tarifas_parking/${id}`
                  : `https://mr-carwash-api.onrender.com/api/servicios_car_wash/${id}`;
              const response = await fetch(endpoint, {
                method: "DELETE"
              });

              if (!response.ok) {
                throw new Error(`Error al eliminar el ${entity}`);
              }

              // Refrescar datos
              fetchData();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Error desconocido");
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!currentEntity) return;

    try {
      let response;
      let endpoint;
      let method;
      let body;

      if (currentEntity === "TarifaParking") {
        endpoint = formData?.id
          ? `https://mr-carwash-api.onrender.com/api/tarifas_parking/${formData.id}`
          : `https://mr-carwash-api.onrender.com/api/tarifas_parking`;
        method = formData?.id ? "PUT" : "POST";
        body = JSON.stringify(formData);
      } else if (currentEntity === "ServicioCarWash") {
        endpoint = formData?.id
          ? `https://mr-carwash-api.onrender.com/api/servicios_car_wash/${formData.id}`
          : `https://mr-carwash-api.onrender.com/api/servicios_car_wash`;
        method = formData?.id ? "PUT" : "POST";
        body = JSON.stringify(formData);
      } else {
        throw new Error("Entidad desconocida");
      }

      response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en la solicitud");
      }

      // Cerrar modal y refrescar datos
      setModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error desconocido");
    }
  };

  const renderTarifa = (tarifa: TarifaParking) => (
    <ThemedView style={styles.itemContainer}>
      <Text style={styles.titulo}>{tarifa.Tipo_Vehiculo}</Text>
      <Text>Tarifa por Hora: ${tarifa.Hora}</Text>
      <Text>Fracción: {tarifa.Fraccion} horas</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit("TarifaParking", tarifa)}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete("TarifaParking", tarifa.id)}
        >
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderServicio = (servicio: ServicioCarWash) => (
    <ThemedView style={styles.itemContainer}>
      <Text style={styles.titulo}>{servicio.Nombre}</Text>
      <Text>Tarifa: ${servicio.Tarifa}</Text>
      <Text>{servicio.Descripcion}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit("ServicioCarWash", servicio)}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete("ServicioCarWash", servicio.id)}
        >
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderFacturaParking = (factura: FacturaParking) => (
    <ThemedView style={styles.itemContainer}>
      <Text style={styles.titulo}>Factura ID: {factura.id}</Text>
      <Text>Ticket ID: {factura.Ticket_id}</Text>
      <Text>Total: ${factura.Total}</Text>
      <Text>Fecha: {factura.Fecha_Factura}</Text>
    </ThemedView>
  );

  const renderItem = ({
    item,
    section
  }: {
    item: TarifaParking | ServicioCarWash | FacturaParking;
    section: SectionData;
  }) => {
    if (section.title === "Tarifas de Parking") {
      return renderTarifa(item as TarifaParking);
    } else if (section.title === "Servicios de Car Wash") {
      return renderServicio(item as ServicioCarWash);
    } else if (section.title === "Facturas de Parking") {
      return renderFacturaParking(item as FacturaParking);
    }
    return null;
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header con Icono y Título */}
      <View style={styles.header}>
        <Ionicons name="car-sport" size={100} color="#fff" />
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Servicios</Text>
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
            "id" in item ? item.id.toString() : index.toString()
          }
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Botón para Agregar TarifaParking y ServicioCarWash */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAdd("TarifaParking")}
        >
          <Text style={styles.buttonText}>Agregar Tarifa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAdd("ServicioCarWash")}
        >
          <Text style={styles.buttonText}>Agregar Servicio</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para Crear/Editar */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {formData &&
                ("Tipo_Vehiculo" in formData
                  ? formData.id
                    ? "Editar Tarifa"
                    : "Agregar Tarifa"
                  : formData.id
                  ? "Editar Servicio"
                  : "Agregar Servicio")}
            </Text>
            {/* Formulario Dinámico */}
            {currentEntity === "TarifaParking" ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Tipo de Vehículo"
                  value={(formData as TarifaParking)?.Tipo_Vehiculo || ""}
                  onChangeText={(text) =>
                    setFormData({ ...formData, Tipo_Vehiculo: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tarifa por Hora"
                  keyboardType="numeric"
                  value={
                    "Hora" in formData && formData.Hora
                      ? formData.Hora.toString()
                      : ""
                  }
                  onChangeText={(text) =>
                    setFormData({ ...formData, Hora: parseFloat(text) })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Fracción (horas)"
                  keyboardType="numeric"
                  value={
                    (formData as TarifaParking)?.Fraccion
                      ? (formData as TarifaParking).Fraccion.toString()
                      : ""
                  }
                  onChangeText={(text) =>
                    setFormData({ ...formData, Fraccion: parseFloat(text) })
                  }
                />
              </>
            ) : currentEntity === "ServicioCarWash" ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del Servicio"
                  value={(formData as ServicioCarWash)?.Nombre || ""}
                  onChangeText={(text) =>
                    setFormData({ ...formData, Nombre: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Descripción"
                  value={(formData as ServicioCarWash)?.Descripcion || ""}
                  onChangeText={(text) =>
                    setFormData({ ...formData, Descripcion: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tarifa"
                  keyboardType="numeric"
                  value={
                    (
                      formData as Partial<ServicioCarWash>
                    )?.Tarifa?.toString() || ""
                  }
                  onChangeText={(text) =>
                    setFormData({ ...formData, Tarifa: parseFloat(text) })
                  }
                />
              </>
            ) : null}

            <View style={styles.modalButtonContainer}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} />
              <Button title="Guardar" onPress={handleSubmit} />
            </View>
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
    backgroundColor: "#D0D0D0",
    paddingVertical: 20,
    alignItems: "center",
    paddingBottom: 40
  },
  titleContainer: {
    marginTop: 10
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff"
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
    backgroundColor: "#ffe0b2",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8
  },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333"
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 8
  },
  editButton: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 4,
    marginRight: 8
  },
  deleteButton: {
    backgroundColor: "#F44336",
    padding: 8,
    borderRadius: 4
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  },
  addButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16
  },
  addButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    width: "45%",
    alignItems: "center"
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginVertical: 6
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16
  }
});
