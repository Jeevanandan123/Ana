import React, { Component } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Modal, ActivityIndicator, TouchableOpacity,
  AsyncStorage,
  FlatList, Image
} from 'react-native';
import CheckBox from 'react-native-check-box';
import Toast from 'react-native-easy-toast';

import Colors from '../utils/Colors';
import { ScrollView } from 'react-native-gesture-handler';
import axios from 'axios';
import General from '../utils/General';
import DropDownPicker from 'react-native-dropdown-picker';
import RadioButton from 'react-native-radio-button';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';

import DocumentPicker from 'react-native-document-picker';
import { Fonts } from '../utils/Fonts';
import ImageResizer from 'react-native-image-resizer';
import { translate } from '../../helper';
import { log } from 'react-native-reanimated';
import { getFontScaleSync } from 'react-native-device-info';
import RNFetchBlob from 'rn-fetch-blob';

class EMR extends Component {
  constructor(props) {
    super(props);


    this.state = {
      formValues: [],
      isLoading: false,
      isLoadingDialog: false,
      EmrFormName: [],
      setEmrName: '',
      fieldValue: '',
      emrformPressed: false,
      localLang: '',
      documentURI: '',
      displayName: '',
      uploadedDocument: '',
      toastAlertVisible: false,
      token: '',
      files: [],
      documents: [],
      items: [],
      fileUploadItems: [],
      uploadVisible: true,
      uploadedFileId: "",
      updateVisible: false,
      isSubmitted: false,
      newlySelectedFiles: {}
    };
  }

  componentDidMount() {
    this._getData()
  }




  _getData = async () => {

    const intialLang = await AsyncStorage.getItem('lang');
    this.setState({
      localLang: intialLang,
    });
    try {
      const value = await AsyncStorage.getItem('@loginData');
      if (value !== null) {
        const item = JSON.parse(value);
        this.setState({ token: item.token });
        this.getFormname()
      }
    } catch (error) {
      console.log('tokenvalue' + error);
    }
  };




  getFormname = () => {

    this.setState({ isLoading: true });
    console.log("this.props.navigation.state.params.specialityId------------------>", this.props.navigation.state.params.specialityId);
    axios.get(General.BASE_URL + '/Emr/GetSpecialityEmrForm?SpecialityId=' + this.props.navigation.state.params.specialityId, {
      headers: {
        Authorization: 'Bearer ' + this.state.token,

      },
    })
      .then(response => {
        this.setState({ isLoading: false });
        if (!response.data.isError) {
          let tempEMR = [];
          if (response.data.responseMessage.length !== 0) {
            console.log("getEMR response.data.responseMessage---------------->", response.data.responseMessage);
            response.data.responseMessage.map((data) => {
              tempEMR.push({
                value: data.emrFormId,
                label: data.emrFormName,
              });
            });
          }
          this.setState({ EmrFormName: tempEMR });
          console.log("setEmrFormName tempEMR ----------------------------", tempEMR);
        } else {
          console.log("getFormname Error:", response.data.errorMessage);
        }
      })
      .catch(error => {
        this.setState({ isLoading: false });
        console.log("getFormname Error loading data:", error);
      });
  };


  getemrlist = (emrFormId) => {
    console.log("emrFormId---------------------->", emrFormId);



    this.setState({ isLoading: true });

    let idCounter = 1;

    axios.get(General.BASE_URL + 'Emr/GetEmrForm?AppointmentId=' + this.props.navigation.state.params.appointmentId + '&EmrFormId=' + emrFormId, {
      headers: {
        Authorization: 'Bearer ' + this.state.token,
      },
    })
      .then(response => {
        console.log("GET emrlist response.data.responseMessage--------------------->", JSON.stringify(response.data.responseMessage))
        this.setState({ isLoading: false });


        const emrFormData = response.data.responseMessage.emrFormDataModel[0];


        let hasData = false;

        emrFormData.emrformGroups.forEach(group => {
          group.groupFormFields.forEach(field => {
            if (field.values && field.values.length > 0) {
              field.values.forEach(value => {
                value.id = idCounter++; // Assign ID and increment counter
              });
            }

            console.log("field--------------->", field);

            if (field.fieldValue && field.fieldValue.trim() !== '') {
              hasData = true;

            }

          });
        })

        this.setState({
          formValues: emrFormData.emrformGroups,
          updateVisible: hasData,
          emrformPressed: !hasData
        },

        );
        console.log("emrFormData.emrformGroups---------------++++>", JSON.stringify(emrFormData.emrformGroups));
      })

      .catch(error => {
        this.setState({ isLoading: false });
        console.log("Error fetching data:", error);
      });
  };


  handleChange = (fieldName, radioId) => {
    const updatedFormValues = this.state.formValues.map(group => {
      if (group.groupFormFields) {
        group.groupFormFields = group.groupFormFields.map(field => {
          if (field.fieldName === fieldName && field.values) {
            field.values = field.values.map(radio => {
              // Check if the radio button id matches
              if (radio.id === radioId) {
                // Toggle isSelected
                radio.isSelected = !radio.isSelected;
                // Return the updated radio button
                return radio;
              }
              return radio;
            });
          }
          return field;
        });
      }
      return group;
    });
    console.log("handleChange=-=-=->", JSON.stringify(updatedFormValues));
    this.setState({ formValues: updatedFormValues });
  };


  handleChangeRadio = (fieldName, radioId,) => {
    console.log("fieldName, radioId---------<>", fieldName, radioId);
    const updatedFormValues = this.state.formValues.map(group => {
      // Find the field matching the fieldName
      const field = group.groupFormFields.find(field => field.emrFormFieldId === fieldName);
      if (field) {
        // Update the isSelected value of radio buttons
        field.values.forEach(radio => {
          radio.isSelected = radio.id === radioId;
        });
        console.log("field", field);
      }
      return group;
    });
    this.setState({ formValues: updatedFormValues });
    console.log("updatedFormValues------------------->", JSON.stringify(updatedFormValues))
  };





  changeTextfeilds = (fieldName, text) => {
    // Update the formValues state with the new field value
    this.setState(prevState => ({
      formValues: prevState.formValues.map(group => ({
        ...group,
        groupFormFields: group.groupFormFields.map(field => {
          if (field.fieldName === fieldName) {
            return {
              ...field,
              fieldValue: text,
            };
          }
          return field;
        }),
      })),
    }));
  };

  handleChangedropdown = (fieldName, selectedValue) => {
    console.log("fieldName, selectedValue--------->", fieldName, selectedValue);

    const updatedFormValues = this.state.formValues.map(group => {
      if (group.groupFormFields) {
        group.groupFormFields = group.groupFormFields.map(field => {
          if (field.fieldName === fieldName && field.formFieldTypeName === 'dropdown') {
            // Update the selected value of the dropdown
            field.values.forEach(option => {
              option.isSelected = option.value === selectedValue;
            });
            field.fieldValue = selectedValue;
          }
          return field;
        });
      }
      return group;
    });

    this.setState({ formValues: updatedFormValues });
    console.log("handleChange DROPDOWN=-=-----------------=->", JSON.stringify(updatedFormValues));
  };










  addItem = (emrFormFieldId) => {
    this.setState(prevState => {
      // Find the field that matches the emrFormFieldId
      const updatedFormValues = prevState.formValues.map(group => {
        group.groupFormFields = group.groupFormFields.map(field => {
          if (field.emrFormFieldId === emrFormFieldId) {
            // Add a new entry to the files array
            const newUploadEntry = {
              id: field.files.length + 1, // Incremental ID
              displayName: '', // Default display name
            };
            return {
              ...field,
              files: [...field.files, newUploadEntry],
            };
          }
          return field;
        });
        return group;
      });

      return { formValues: updatedFormValues };
    });
  };

  deleteDoc = (emrFormFieldId, itemIndex) => {
    this.setState(prevState => {
      // Find the field that matches the emrFormFieldId
      const updatedFormValues = prevState.formValues.map(group => {
        group.groupFormFields = group.groupFormFields.map(field => {
          if (field.emrFormFieldId === emrFormFieldId) {
            // Remove the file entry at itemIndex
            const updatedFiles = field.files.filter((_, index) => index !== itemIndex);
            return {
              ...field,
              files: updatedFiles.length > 0 ? updatedFiles : [],
            };
          }
          return field;
        });
        return group;
      });

      return { formValues: updatedFormValues };
    });
  }






  downloadEMR = async (appntemrformfieldFileMapId) => {
    this.setState({ isLoading: true });

    const value = this.state.token;
    axios
      .get(
        General.BASE_URL +
        'Emr/DownloadFileAttachment?AppntemrformfieldFileMapId=' +
        appntemrformfieldFileMapId,
        {
          headers: {
            Authorization: 'Bearer ' + value,
          },
        },
      )
      .then((response) => {
        try {
          if (response.status == 200) {
            let options = {
              url:
                General.BASE_URL +
                'Emr/DownloadFileAttachment?AppntemrformfieldFileMapId=' +
                appntemrformfieldFileMapId,
              fileName:
                'EMR' + appntemrformfieldFileMapId + '.pdf',
            };

            this.downloadImage(options, appntemrformfieldFileMapId);
          } else {
            console.log('Something went wrong. Please try again.');
          }
        } catch (error) {
          console.log("error ======> ", error);
          setTimeout(() => {
            console.log('Something went wrong. Please try again.');
          }, 1000);
        }
      })
      .catch((error) => {
        this.setState({ isLoading: false });
        console.log("error++++++++++>", error);
        // this.refs.toasterror.show('First upload the file then come and download');


        setTimeout(() => {
          console.log('Something went wrong. Please try again.');
        }, 1000);
      });
  };



  downloadImage = (response, appntemrformfieldFileMapId) => {
    this.setState({ isLoading: true });

    this.setState({ content: 'Downloading' });

    let date = new Date();
    let image_URL = response.url;
    let extension = this.getExtention(response.fileName);
    extension = extension[0];

    const { config, fs } = RNFetchBlob;
    let DownloadDir = fs.dirs.DownloadDir;
    let options = {
      fileCache: true,
      appendExt: extension,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        title: 'EMR' + appntemrformfieldFileMapId,
        path:
          DownloadDir +
          `/${'EMR - ' + appntemrformfieldFileMapId
          }` +
          '.' +
          extension,
        description: 'Downloading file.',
      },
    };
    config(options)
      .fetch('GET', image_URL, {
        Authorization: `Bearer ${this.state.token}`,
      })
      .then((response) => {
        this.refs.toastsuccess.show(translate('filedownloadedsuccessfully'), 2000);
        this.setState({ isLoading: false });
      })
      .catch((err) => {
        console.log("err------------------>", err);
        this.setState({ isLoading: false });
        // return reject(err);
      });
  };


  _deleteEmr = (appntemrformfieldFileMapId, emrFormFieldId, itemIndex) => {
    const { fileUploadItems } = this.state
    this.setState({ isLoading: true });
    console.log("appntemrformfieldFileMapId------------->", appntemrformfieldFileMapId);

    if (appntemrformfieldFileMapId) {
      axios.delete(General.BASE_URL + 'Emr/DeleteSubmitFileById?appntemrformfieldfilemapid=' + appntemrformfieldFileMapId, {
        headers: {
          Authorization: 'Bearer ' + this.state.token,
        },
      })
        .then((response) => {
          this.setState({ isLoading: false });
          console.log("response-------------------->", response);
          if (!response.data.isError) {
            this.setState(prevState => {
              const updatedFormValues = prevState.formValues.map(group => {
                group.groupFormFields = group.groupFormFields.map(field => {
                  if (field.emrFormFieldId === emrFormFieldId) {
                    const updatedFiles = field.files.filter((_, index) => index !== itemIndex);
                    return {
                      ...field,
                      files: updatedFiles,
                    };
                  }
                  return field;
                });
                return group;
              });
              return { formValues: updatedFormValues };
            });

            setTimeout(() => {
              this.refs.toastsuccess.show(response.data.responseMessage, 2500);
              console.log("Delete response.data.responseMessage----------->");
            }, 500);
          } else {
            console.log("Delete response.data.------------------------------>", response.data);
            this.refs.toasterror.show(response.data.errorMessage, 2500);
          }
        })
        .catch((error) => {
          this.setState({ isLoading: false });
          console.log(error);
          setTimeout(() => {
            this.refs.toasterror.show('Something went wrong', 2500);
          }, 1000);
        });
    } else {
      // Directly update state when appntemrformfieldFileMapId is not present
      this.setState(prevState => {
        const updatedFormValues = prevState.formValues.map(group => {
          group.groupFormFields = group.groupFormFields.map(field => {
            if (field.emrFormFieldId === emrFormFieldId) {
              const updatedFiles = field.files.filter((_, index) => index !== itemIndex);
              return {
                ...field,
                files: updatedFiles,
              };
            }
            return field;
          });
          return group;
        });
        return { formValues: updatedFormValues, isLoading: false };
      });
    }
  };



  selectDoc = async (emrFormFieldId) => {
    try {
      const field = this.state.formValues.find(group =>
        group.groupFormFields.some(f => f.emrFormFieldId === emrFormFieldId)
      ).groupFormFields.find(f => f.emrFormFieldId === emrFormFieldId);

      const maxFileSize = field.maxFileSize; // Get maxFileSize from field
      const allowedFileTypes = field.fileTypes.map(type => type.typeName.toUpperCase());
      let pickerTypes = [];

      allowedFileTypes.forEach(type => {
        if (type === 'JPG' || type === 'JPEG' || type === 'PNG') {
          pickerTypes.push(DocumentPicker.types.images);
        } else if (type === 'PDF') {
          pickerTypes.push(DocumentPicker.types.pdf);
        } else if (type === 'TXT') {
          pickerTypes.push(DocumentPicker.types.plainText);
        } else if (type === 'DOC') {
          pickerTypes.push(DocumentPicker.types.allFiles);
        } else {
          pickerTypes.push(DocumentPicker.types.allFiles);
        }
      });

      const res = await DocumentPicker.pick({
        type: pickerTypes
      });

      const sizeInMB = (res.size / (1024 * 1024)).toFixed(2);
      console.log("sizeInMB----------------------------->", sizeInMB);

      if (sizeInMB <= maxFileSize) {
        const fileExtension = res.name.split('.').pop().toLowerCase();
        let fname = '';

        if (['jpeg', 'jpg', 'png'].includes(fileExtension)) {
          try {
            const response = await ImageResizer.createResizedImage(res.uri, 150, 300, 'JPEG', 100, 0);
            fname = response.uri;
          } catch (err) {
            console.log("Image resize error:", err);
          }
        }

        setTimeout(() => {
          const documentURI = ['jpeg', 'jpg', 'png'].includes(fileExtension) ? fname : res.uri;

          this.setState(prevState => {
            const updatedFormValues = prevState.formValues.map(group => {
              group.groupFormFields = group.groupFormFields.map(field => {
                if (field.emrFormFieldId === emrFormFieldId) {
                  const updatedUploads = [...field.files, { displayName: res.name, file: res }];
                  return { ...field, files: updatedUploads };
                }
                return field;
              });
              return group;
            });



            return {
              formValues: updatedFormValues,

            };
          });
        }, 500);
      } else {
        this.refs.toasterror.show(
          `This file exceeds the maximum size limit of ${maxFileSize}MB`,
        );
        // Handle UI feedback for file size exceeded
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log("Document picker cancelled");
      } else {
        console.log("Document picker error:", err);
      }
    }
  };

  checkAppntEmrMapId = (files, appntEmrMapId) => {
    return files.filter(file => file.appntEmrMapId === appntEmrMapId);
  };


  fileUpload = async (emrFormFieldId, emrformfieldEmrgroupMapId, appntEmrMapformfieldFileMapId, appntEmrMapId) => {
    this.setState({ isLoading: true });
    const { fileUploadItems } = this.state;


    // Initialize an empty array to collect the final result
    let finalArray = [];

    const groupFormFields = this.state.formValues[0].groupFormFields; // Accessing the groupFormFields array

    groupFormFields.forEach(field => {
      // Check if the field meets the condition
      if (field.emrFormFieldId === emrFormFieldId) {

        // Extract files without appntEmrMapId and push them to finalArray
        const extractedFiles = field.files.map(file => {
          const { appntEmrMapId, ...filesWithoutKey } = file;
          return filesWithoutKey;
        });



        // Add extracted files to finalArray
        finalArray.push(...extractedFiles);
      }
    });

    // Filter finalArray to exclude objects with appntEmrMapId
    const filteredArray = finalArray.filter(item => item.hasOwnProperty('displayName') && (item.file !== undefined));


    console.log("filtered array", filteredArray)


    if (filteredArray.length === 0) {
      console.log('No files selected for upload');
      this.refs.toasterror.show('No files selected for upload');
      this.setState({ isLoading: false });
      return;
    }

    const formData = new FormData();
    formData.append("AppointmentId", this.props.navigation.state.params.appointmentId);
    formData.append("EmrFormFieldGroupMapId", emrformfieldEmrgroupMapId);

    if (appntEmrMapId != 0) {
      formData.append("AppntEmrMapId", appntEmrMapId);
    }

    filteredArray.forEach((fileUploadItem) => {


      if (fileUploadItem.file) {
        formData.append("Files", {
          uri: fileUploadItem.file.uri,
          name: fileUploadItem.file.name,
          type: fileUploadItem.file.type,
        });
      }
    });

    console.log("SubmitFileAttachment fileUpload formData---------------------->", JSON.stringify(formData));

    try {
      const response = await axios.post(`${General.BASE_URL}Emr/SubmitFileAttachment`, formData, {
        headers: {
          Authorization: `Bearer ${this.state.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      this.setState({ isLoading: false });

      console.log("fileUpload response---------------------->", response);
      if (!response.data.isError) {
        console.log('response.data.responseData==========>', response.data.responseData);
        this.setState({
          uploadedFileId: response.data.responseData,
          updateVisible: true,
          emrformPressed: false
        });

        try {
          await AsyncStorage.setItem('uploadedFileId', response.data.responseData.toString());
          console.log('uploadedFileId saved to AsyncStorage');
        } catch (error) {
          console.log('Error saving uploadedFileId to AsyncStorage: ', error);
        }
        this.refs.toastsuccess.show(response.data.responseMessage, 2500);


        this.loadEmrDetails(this.state.setEmrName,emrFormFieldId)
      } else {
        console.log("response.data.errorMessage------------->" + response.data.errorMessage);
        this.refs.toasterror.show(response.data.errorMessage, 2500);
        this.setState({ toastAlertVisible: true });
      }
    } catch (error) {
      this.setState({ isLoading: false });
      console.log('Error uploading file: ', error);
      this.refs.toasterror.show('Error uploading file', 2500);
      this.setState({ toastAlertVisible: true });
    }
  };



  loadEmrDetails = (emrFormId,emrFormFieldId) => {

    this.setState({ isLoading: true });


    axios.get(General.BASE_URL + 'Emr/GetEmrForm?AppointmentId=' + this.props.navigation.state.params.appointmentId + '&EmrFormId=' + emrFormId, {
      headers: {
        Authorization: 'Bearer ' + this.state.token,
      },
    })
      .then(response => {
        console.log("GET emrlist response.data.responseMessage--------------------->", JSON.stringify(response.data.responseMessage))
        this.setState({ isLoading: false });


        const emrFormData = response.data.responseMessage.emrFormDataModel[0];

        console.log( emrFormData.emrformGroups[0].groupFormFields)

        this.setState(prevState => {
          const updatedFormValues = prevState.formValues.map(group => {
            group.groupFormFields = group.groupFormFields.map(field => {
              if (field.emrFormFieldId === emrFormFieldId) {
                const filesArray =  emrFormData.emrformGroups[0].groupFormFields.find(field => field.emrFormFieldId === emrFormFieldId).files;
                const updatedFiles = filesArray
                return {
                  ...field,
                  files: updatedFiles,
                };
              }
              return field;
            });
            return group;
          });
          return { formValues: updatedFormValues };
        });

        console.log("emrFormData.emrformGroups---------------++++>", JSON.stringify(emrFormData.emrformGroups));
      })

      .catch(error => {
        this.setState({ isLoading: false });
        console.log("Error fetching data:", error);
      });
  };



  getExtention = (filename) => {
    return /[.]/.exec(filename) ? /[^.]+$/.exec(filename) : undefined;
  };



  // _deleteEmr = (appntemrformfieldFileMapId, emrFormFieldId, itemIndex) => {
  //   this.setState({ isLoading: true });
  //   console.log("appntemrformfieldFileMapId------------->", appntemrformfieldFileMapId);

  //   if (appntemrformfieldFileMapId) {
  //     axios.delete(General.BASE_URL + 'Emr/DeleteSubmitFileById?appntemrformfieldfilemapid=' + appntemrformfieldFileMapId, {
  //       headers: {
  //         Authorization: 'Bearer ' + this.state.token,
  //       },
  //     })
  //       .then((response) => {
  //         this.setState({ isLoading: false });
  //         console.log("response-------------------->", response);
  //         if (!response.data.isError) {





  //           this.setState(prevState => {
  //             const updatedFormValues = prevState.formValues.map(group => {
  //               group.groupFormFields = group.groupFormFields.map(field => {
  //                 if (field.emrFormFieldId === emrFormFieldId) {
  //                   const updatedFiles = field.files.filter((_, index) => index !== itemIndex);
  //                   return {
  //                     ...field,
  //                     files: updatedFiles,
  //                   };
  //                 }
  //                 return field;
  //               });
  //               return group;
  //             });
  //             return { formValues: updatedFormValues };
  //           });





  //           setTimeout(() => {
  //             this.refs.toastsuccess.show(response.data.responseMessage, 2500);
  //             console.log("Delete response.data.responseMessage----------->");
  //           }, 500);
  //         } else {
  //           console.log("Delete response.data.------------------------------>", response.data.errorMessage);
  //           this.refs.toasterror.show(response.data.errorMessage, 2500);
  //         }
  //       })
  //       .catch((error) => {
  //         this.setState({ isLoading: false });
  //         console.log(error);
  //         setTimeout(() => {
  //           this.refs.toasterror.show('Something went wrong', 2500);
  //         }, 1000);
  //       });
  //   } else {






  //     this.setState(prevState => {
  //       const updatedFormValues = prevState.formValues.map(group => {
  //         group.groupFormFields = group.groupFormFields.map(field => {
  //           if (field.emrFormFieldId === emrFormFieldId) {
  //             const updatedFiles = field.files.filter((_, index) => index !== itemIndex);
  //             return {
  //               ...field,
  //               files: updatedFiles,
  //             };
  //           }
  //           return field;
  //         });
  //         return group;
  //       });
  //       return { formValues: updatedFormValues, isLoading: false };
  //     });
  //   }
  // };



  // selectDoc = async (emrFormFieldId) => {
  //   try {
  //     const field = this.state.formValues.find(group =>
  //       group.groupFormFields.some(f => f.emrFormFieldId === emrFormFieldId)
  //     ).groupFormFields.find(f => f.emrFormFieldId === emrFormFieldId);

  //     const maxFileSize = field.maxFileSize; // Get maxFileSize from field
  //     const allowedFileTypes = field.fileTypes.map(type => type.typeName.toUpperCase());
  //     let pickerTypes = [];

  //     allowedFileTypes.forEach(type => {
  //       if (type === 'JPG' || type === 'JPEG' || type === 'PNG') {
  //         pickerTypes.push(DocumentPicker.types.images);
  //       } else if (type === 'PDF') {
  //         pickerTypes.push(DocumentPicker.types.pdf);
  //       } else if (type === 'TXT') {
  //         pickerTypes.push(DocumentPicker.types.plainText);
  //       } else if (type === 'DOC') {
  //         pickerTypes.push(DocumentPicker.types.allFiles);
  //       } else {
  //         pickerTypes.push(DocumentPicker.types.allFiles);
  //       }
  //     });

  //     const res = await DocumentPicker.pick({
  //       type: pickerTypes
  //     });

  //     const sizeInMB = (res.size / (1024 * 1024)).toFixed(2);
  //     console.log("sizeInMB----------------------------->", sizeInMB);

  //     if (sizeInMB <= maxFileSize) {
  //       const fileExtension = res.name.split('.').pop().toLowerCase();
  //       let fname = '';

  //       if (['jpeg', 'jpg', 'png'].includes(fileExtension)) {
  //         try {
  //           const response = await ImageResizer.createResizedImage(res.uri, 150, 300, 'JPEG', 100, 0);
  //           fname = response.uri;
  //         } catch (err) {
  //           console.log("Image resize error:", err);
  //         }
  //       }

  //       setTimeout(() => {
  //         const documentURI = ['jpeg', 'jpg', 'png'].includes(fileExtension) ? fname : res.uri;

  //         this.setState(prevState => {
  //           const updatedFormValues = prevState.formValues.map(group => {
  //             group.groupFormFields = group.groupFormFields.map(field => {
  //               if (field.emrFormFieldId === emrFormFieldId) {
  //                 const updatedUploads = [...field.files, { displayName: res.name, file: res }];
  //                 return { ...field, files: updatedUploads };
  //               }
  //               return field;
  //             });
  //             return group;
  //           });

  //           const updatedFileUploadItems = { ...prevState.fileUploadItems };
  //           if (!updatedFileUploadItems[emrFormFieldId]) {
  //             updatedFileUploadItems[emrFormFieldId] = [];
  //           }
  //           updatedFileUploadItems[emrFormFieldId].push({ displayName: res.name, file: res });

  //           return {
  //             formValues: updatedFormValues,
  //             documentURI: {
  //               ...prevState.documentURI,
  //               [emrFormFieldId]: documentURI,
  //             },
  //             fileUploadItems: updatedFileUploadItems,
  //           };
  //         });
  //       }, 500);
  //     } else {
  //       this.refs.toasterror.show(
  //         `This file exceeds the maximum size limit of ${maxFileSize}MB`,
  //       );
  //       // Handle UI feedback for file size exceeded
  //     }
  //   } catch (err) {
  //     if (DocumentPicker.isCancel(err)) {
  //       console.log("Document picker cancelled");
  //     } else {
  //       console.log("Document picker error:", err);
  //     }
  //   }
  // };




  // fileUpload = async (emrFormFieldId, emrformfieldEmrgroupMapId, appntEmrMapformfieldFileMapId, appntEmrMapId) => {
  //   this.setState({ isLoading: true });
  //   const { fileUploadItems } = this.state;

  //   const selectedFiles = fileUploadItems[emrFormFieldId] || [];
  //   if (selectedFiles.length === 0) {
  //     console.log('No files selected for upload');
  //     this.refs.toasterror.show('No files selected for upload');
  //     this.setState({ isLoading: false });
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append("AppointmentId", this.props.navigation.state.params.appointmentId);
  //   formData.append("EmrFormFieldGroupMapId", emrformfieldEmrgroupMapId);

  //   if (appntEmrMapId) {
  //     formData.append("AppntEmrMapId", appntEmrMapId);
  //   }

  //   selectedFiles.forEach((fileUploadItem) => {
  //     if (fileUploadItem.file) {
  //       formData.append("Files", {
  //         uri: fileUploadItem.file.uri,
  //         name: fileUploadItem.file.name,
  //         type: fileUploadItem.file.type,
  //       });
  //     }
  //   });

  //   console.log("SubmitFileAttachment fileUpload formData---------------------->", JSON.stringify(formData));

  //   try {
  //     const response = await axios.post(`${General.BASE_URL}Emr/SubmitFileAttachment`, formData, {
  //       headers: {
  //         Authorization: `Bearer ${this.state.token}`,
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     });

  //     this.setState({ isLoading: false });
  //     if (!response.data.isError) {
  //       console.log('response.data.responseData==========>', response.data.responseData);
  //       this.setState({
  //         uploadedFileId: response.data.responseData,
  //         updateVisible: true,
  //         emrformPressed: false
  //       });

  //       try {
  //         await AsyncStorage.setItem('uploadedFileId', response.data.responseData.toString());
  //         console.log('uploadedFileId saved to AsyncStorage');
  //       } catch (error) {
  //         console.log('Error saving uploadedFileId to AsyncStorage: ', error);
  //       }
  //       this.refs.toastsuccess.show(response.data.responseMessage, 2500);

  //       // this.getemrlist(this.state.setEmrName)


  //     } else {
  //       console.log("response.data.errorMessage------------->" + response.data.errorMessage);
  //       this.refs.toasterror.show(response.data.errorMessage, 2500);
  //       this.setState({ toastAlertVisible: true });
  //     }
  //   } catch (error) {
  //     this.setState({ isLoading: false });
  //     console.log('Error uploading file: ', error);
  //     this.refs.toasterror.show('Error uploading file', 2500);
  //     this.setState({ toastAlertVisible: true });
  //   }
  // };




  submitEmrForm = (emrFormFieldId) => {

    console.log(emrFormFieldId);

    this.setState({ isLoading: true });
    const { formValues } = this.state;

    let isEmpty = false;

    formValues.forEach(group => {
      group.groupFormFields.forEach(field => {
        if (field.isMandatory) {
          if (['textfield', 'textarea', 'numberfield'].includes(field.formFieldTypeName)) {
            if (!field.fieldValue || field.fieldValue.trim() === '') {
              isEmpty = true;
            }
          } else if (['checkbox', 'radiobutton', 'dropdown'].includes(field.formFieldTypeName)) {
            const isSelected = field.values.some(value => value.isSelected);
            if (!isSelected) {
              isEmpty = true;
            }
          } else if (field.formFieldTypeName === 'fileupload') {
            if (field.files.length === 0) {
              isEmpty = true;
            }
          }
        }
      });
    });

    if (isEmpty) {
      this.setState({ isLoading: false });
      console.log("isEmpty----------------------->", isEmpty);
      this.refs.toasterror.show('Please fill the mandatory fields.', 2500);
      return;
    }

    const emrFormFields = formValues.reduce((acc, group) => {
      group.groupFormFields.forEach(field => {
        if (field.formFieldTypeName === 'textfield' || field.formFieldTypeName === 'textarea' || field.formFieldTypeName === 'numberfield') {
          acc.push({
            EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
            FieldValue: field.fieldValue
          });
        } else if (field.formFieldTypeName === 'checkbox') {
          // Create an array of objects for the checkbox values
          const checkboxValues = field.values.filter(checkbox => checkbox.isSelected).map(checkbox => ({ EmrformfieldOptionId: checkbox.emrformfieldOptionId }));
          if (checkboxValues.length > 0) {
            acc.push({
              EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
              Values: checkboxValues
            });
          }
        } else if (field.formFieldTypeName === 'radiobutton') {
          const selectedRadio = field.values.filter(radio => radio.isSelected).map(radio => ({ EmrformfieldOptionId: radio.emrformfieldOptionId }));
          if (selectedRadio.length > 0) {
            acc.push({
              EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
              Values: selectedRadio
            });
          }
        } else if (field.formFieldTypeName === 'dropdown') {
          const selectedDrop = field.values.filter(dropdown => dropdown.isSelected).map(dropdown => ({ EmrformfieldOptionId: dropdown.emrformfieldOptionId }));
          if (selectedDrop.length > 0) {
            acc.push({
              EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
              Values: selectedDrop
            });
          }
        }

        // else if (field.formFieldTypeName === 'fileupload') {
        //   const fileUploads = field.files;
        //   if (fileUploads.length > 0) {
        //     fileUploads.forEach(fileUpload => {
        //       acc.push({
        //         EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
        //         AppntemrFormfieldMapId: field.appntemrFormfieldMapId,
        //         Files: {
        //           uri: fileUpload.file.uri,
        //           name: fileUpload.file.name,
        //           type: fileUpload.file.type,
        //         }
        //       });
        //     });
        //   }
        // }

      });
      return acc;
    }, []);

    const emrForm = {
      AppointmentId: this.props.navigation.state.params.appointmentId,
      EmrFormfields: emrFormFields,
    };

    console.log("emrForm-------------->", JSON.stringify(emrForm));

    axios
      .post(General.BASE_URL + 'Emr/SubmitEmrForm', emrForm, {
        headers: {
          Authorization: 'Bearer ' + this.state.token,
        },
      })
      .then((response) => {
        this.setState({ isLoading: false });

        // console.log("submitEmrForm response---------------------->", response);
        try {
          // console.log("postcheck11")
          if (response.data.isError == false) {
            console.log('response.data.isError-------->', response.data.isError);

            // console.log(
            //   'submitEmrForm----------------->' + JSON.stringify(response.data.responseMessage),
            // )
            this.refs.toastsuccess.show(response.data.responseMessage, 2500);


          } else {

            this.refs.toasterror.show(response.data.errorMessage, 2500);
            // console.log("errormessage--------------->" + response.data.errorMessage);
          }
        } catch (error) {

          console.log('errormessage=====>' + error);
        }
      })
      .catch(function (error) {
        console.log('errormessage++++++++>' + error);

        setTimeout(() => {
          this.refs.toasterror.show('Something went wrong. Please try again.', 2500);

          console.log(); ('Something went wrong. Please try again.');
        }, 1000);
      });
  };

  updateEmrForm = async () => {

    this.setState({ isLoading: true });

    const { formValues, uploadedFileId } = this.state;
    const uploadedFile = await AsyncStorage.getItem('uploadedFileId');
    const fileUploadItems = this.state.fileUploadItems || [];

    console.log("ASYNC STORAGE uploadedFile-------------------->", uploadedFile);
    // Check if any mandatory fields are empty

    let isEmpty = false;

    formValues.forEach(group => {
      group.groupFormFields.forEach(field => {
        if (field.isMandatory) {
          if (['textfield', 'textarea', 'numberfield'].includes(field.formFieldTypeName)) {
            if (!field.fieldValue || field.fieldValue.trim() === '') {
              isEmpty = true;
            }
          } else if (['checkbox', 'radiobutton', 'dropdown'].includes(field.formFieldTypeName)) {
            const isSelected = field.values.some(value => value.isSelected);
            if (!isSelected) {
              isEmpty = true;
            }
          } else if (field.formFieldTypeName === 'fileupload') {
            if (field.files.length === 0) {
              isEmpty = true;
            }
          }
        }
      });
    });

    if (isEmpty) {
      this.setState({ isLoading: false });
      console.log("isEmpty----------------------->", isEmpty);
      this.refs.toasterror.show('Please fill the mandatory fields.', 2500);
      return;
    }
    const emrFormFields = formValues.reduce((acc, group) => {
      group.groupFormFields.forEach(field => {
        if (['textfield', 'textarea', 'numberfield'].includes(field.formFieldTypeName)) {
          acc.push({
            EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
            AppntemrFormfieldMapId: field.appntemrFormfieldMapId,
            FieldValue: field.fieldValue
          });
        } else if (field.formFieldTypeName === 'checkbox') {
          const checkboxValues = field.values.filter(checkbox => checkbox.isSelected).map(checkbox => ({
            EmrformfieldOptionId: checkbox.emrformfieldOptionId
          }));
          if (checkboxValues.length > 0) {
            acc.push({
              EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
              AppntemrFormfieldMapId: field.appntemrFormfieldMapId,
              Values: checkboxValues
            });
          }
        } else if (field.formFieldTypeName === 'radiobutton') {
          const selectedRadio = field.values.filter(radio => radio.isSelected).map(radio => ({
            EmrformfieldOptionId: radio.emrformfieldOptionId
          }));
          if (selectedRadio.length > 0) {
            acc.push({
              EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
              AppntemrFormfieldMapId: field.appntemrFormfieldMapId,
              Values: selectedRadio
            });
          }
        } else if (field.formFieldTypeName === 'dropdown') {
          const selectedDrop = field.values.filter(dropdown => dropdown.isSelected).map(dropdown => ({
            EmrformfieldOptionId: dropdown.emrformfieldOptionId
          }));
          if (selectedDrop.length > 0) {
            acc.push({
              EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
              AppntemrFormfieldMapId: field.appntemrFormfieldMapId,
              Values: selectedDrop
            });
          }
        }
        // else if (field.formFieldTypeName === 'fileupload') {
        //   const fileUploads = field.files;
        //   if (fileUploads.length > 0) {
        //     fileUploads.forEach(fileUpload => {
        //       acc.push({
        //         EmrFormFieldGroupMapId: field.emrformfieldEmrgroupMapId,
        //         AppntemrFormfieldMapId: field.appntemrFormfieldMapId,
        //         Files: {
        //           uri: fileUpload.file.uri,
        //           name: fileUpload.file.name,
        //           type: fileUpload.file.type,
        //         }
        //       });
        //     });
        //   }
        // }


      });
      return acc;
    }, []);


    const updateForm = {
      AppntEmrMapId: uploadedFile,
      AppointmentId: this.props.navigation.state.params.appointmentId,
      EmrFormfields: emrFormFields,
    };

    console.log("updateForm--------------->", JSON.stringify(updateForm));



    axios
      .put(General.BASE_URL + 'Emr/UpdateEmrForm', updateForm, {
        headers: {
          Authorization: 'Bearer ' + this.state.token,
        },
      })
      .then((response) => {
        this.setState({ isLoading: false });
        if (response.data.isError === false) {
          // console.log('UpdateEmrForm response.data.isError-------->', response.data.isError);
          console.log('UpdateEmrForm submitEmrForm----------------->' + JSON.stringify(response.data.responseMessage));
          this.setState({
            updateVisible: true,
            emrformPressed: false, isSubmitted: true
          })

          this.refs.toastsuccess.show(response.data.responseMessage, 2500);
        } else {
          this.refs.toasterror.show(response.data.errorMessage, 2500);
          console.log("UpdateEmrForm errormessage--------------->" + response.data.errorMessage);
        }
      })
      .catch((error) => {
        this.setState({ isLoading: false });
        console.log('UpdateEmrForm errormessage++++++++>', error);
        setTimeout(() => {
          this.refs.toasterror.show('Something went wrong. Please try again.', 2500);
          console.log('Something went wrong. Please try again++++++++.');
        }, 1000);
      });

    this.setState({ isLoading: false });


  }


  DocumentPicker = async () => {
    const res = await DocumentPicker.pick({
      type: [DocumentPicker.types.allFiles],
    });

    var sizeInMB = (res.size / (1024 * 1024)).toFixed(2);

    if (sizeInMB < 5.01) {
      var testStr = res.type;
      var testStrN = res.name;
      var splitStr = testStr.substring(testStr.indexOf('/') + 1);
      var fileExtention = testStrN.substr(testStrN.lastIndexOf('.') + 1);
      this._onPostRecord(res.uri, res.name);
      var fname = '';
      ImageResizer.createResizedImage(res.uri, 100, 100, 'JPEG', 100,)
        .then((response) => {
          this.setState({ isLoadingDialog: true });
          return (fname = response.uri);
        })
        .catch((err) => { });
    } else {
      this.refs.toasterror.show(
        'This file exceeds the maximum size limit of 5MB',
      );
    }
  };



  isAnyFieldValueFilled = () => {
    const { groupFormFields } = this.props.group;
    return groupFormFields.some(field => field.fieldValue && field.fieldValue.trim() !== '');
  };


  render() {
    const { formValues, isLoading, fileUploadItems, isSubmitted } = this.state;


    const { field } = this.props;
    const { files, displayName } = this.state;

    return (
      <View style={{ flex: 1, backgroundColor: Colors.white }}>
        <View style={styles.container}>
          <View style={styles.imageWrapper}>
            <View
              style={{
                flexDirection:
                  this.state.localLang == 'ar' ? 'row-reverse' : 'row',
                marginTop: 30,
                justifyContent: 'space-between',
              }}>
              {this.state.localLang !== 'ar' && (
                <Feather
                  onPress={() => {
                    this.props.navigation.goBack(null);
                  }}
                  style={{
                    alignSelf: 'flex-end',
                    marginLeft: 16,
                    marginTop: 2.5,
                  }}
                  name="arrow-left"
                  size={25}
                  color={Colors.white}
                />
              )}
              {this.state.localLang == 'ar' && (
                <Feather
                  onPress={() => {
                    this.props.navigation.goBack(null);
                  }}
                  style={{
                    alignSelf: 'flex-end',
                    marginRight: 16,
                    marginTop: 2.5,
                  }}
                  name="arrow-right"
                  size={25}
                  color={Colors.white}
                />
              )}
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 20,
                  color: Colors.white,
                  fontFamily: Fonts.rubikSemiBold,
                }}>
                {('EMR')}
              </Text>
              <View
                style={{ alignSelf: 'flex-end', marginRight: 20, width: 25 }}
              />
            </View>
          </View>
        </View>


        <View style={{

          // flexDirection:
          // this.state.localLang == 'ar'
          //   ? 'row-reverse'
          //   : 'row', 

          marginLeft: 20, marginRight: 20, marginTop: 20, marginBottom: 10
        }}>
          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: Fonts.rubikSemiBold,
                color: Colors.primaryColor,
                marginLeft: 2,
                textAlign:
                  this.state.localLang == 'ar' ? 'right' : 'left',
              }}>
              {translate('formname')}
            </Text>
          </View>

          <DropDownPicker
            items={
              this.state.EmrFormName
            }
            labelStyle={{
              textAlign:
                this.state.localLang == 'ar' ? 'right' : 'left',
              transform:
                this.state.localLang == 'ar'
                  ? [{ rotateY: '180deg' }]
                  : [{ rotateY: '0deg' }],
            }}
            itemStyle={{
              justifyContent:
                this.state.localLang == 'ar'
                  ? 'flex-start'
                  : 'flex-start',
              fontFamily: Fonts.rubikRegular,
            }}

            controller={(instance) => (this.controller = instance)}
            arrowStyle={{
              marginRight: 10,
            }}
            showArrow="true"
            arrowColor={Colors.secondaryColor}
            defaultValue={this.state.setEmrName}
            containerStyle={{
              marginBottom: 10,
              marginTop: 20,
              marginBottom: 3,
              height: 50,
            }}
            placeholder={translate('selectformname')}
            placeholderStyle={{ fontSize: 14, color: Colors.grey_5, fontFamily: Fonts.rubikRegular, }}
            placeholderTextColor={Colors.grey_3}
            place
            style={{

              backgroundColor: '#fff',
              transform:
                this.state.localLang == 'ar'
                  ? [{ rotateY: '180deg' }]
                  : [{ rotateY: '0deg' }],
            }}
            dropDownStyle={{
              backgroundColor: '#fff',
              fontFamily: Fonts.rubikRegular,
              transform:
                this.state.localLang == 'ar'
                  ? [{ rotateY: '180deg' }]
                  : [{ rotateY: '0deg' }],
            }}
            onChangeItem={(item) => {
              this.setState({
                setEmrName: item.value,
                emrformPressed: true,
                updateVisible: false,
              })
              this.getemrlist(item.value)

            }}
          />
        </View>


        {
          this.state.formValues == "" ?
            <View style={styles.emptyListStyle}>
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 14,
                  fontFamily: Fonts.rubikRegular,
                  color: Colors.grey_6,
                }}>
                {translate('norecordsfound')}
              </Text>
            </View>
            :

            <ScrollView
              showsHorizontalScrollIndicator={false}
            >
              {formValues.map((group) => (

                <View style={{}} key={group.emrformgroupid}>



                  {/* 
            // <View style={styles.emptyListStyle}>
            //   <Text
            //     style={{
            //       textAlign: 'center',
            //       fontSize: 14,
            //       fontFamily: Fonts.rubikRegular,
            //       color: Colors.grey_6,
            //     }}>
            //     {translate('nodatafound')}
            //   </Text>
            // </View>
            // : */}
                  <View style={{
                    flex: 1,
                    marginTop: 10,
                    marginBottom: 20,
                    marginLeft: 20,
                    marginRight: 20,
                    borderRadius: 4,
                    shadowOpacity: 0.23,
                    shadowRadius: 2.62,
                    elevation: 4,
                    backgroundColor: 'white',

                    height: 'auto',
                    padding: 0,
                    borderRadius: 7,
                  }}>

                    <Text style={{
                      backgroundColor: Colors.primaryColor,
                      padding: 10,
                      borderTopLeftRadius: 5,
                      borderTopRightRadius: 5,
                      marginBottom: 10,
                      color: 'white',
                      textAlign: this.state.localLang == "en" ? "left" : "right",
                      fontSize: 14,
                      fontFamily: Fonts.rubikRegular,
                    }}>
                      {group.groupname}
                    </Text>
                    <View>
                      {group.groupFormFields.map((field, fieldIndex) => (
                        <View
                          // key={field.emrformFormfieldMapId} 
                          style={{ marginLeft: 10, marginRight: 10, marginBottom: 20 }}>


                          <View style={{ flexDirection: this.state.localLang == "en" ? "row" : "row-reverse" }}>
                            <Text style={{

                              fontFamily: Fonts.rubikSemiBold,
                              color: Colors.primaryColor, marginLeft: 3
                            }}>
                              {field.fieldName}
                            </Text>
                            {
                              field.unit == "" ?
                                <Text style={{ fontFamily: Fonts.rubikRegular, color: Colors.primaryColor, marginLeft: 3 }}>
                                  {"("}{field.unit}{")"}
                                </Text>
                                :
                                null

                            }


                            {
                              field.isMandatory == true ?
                                <Text style={{ color: Colors.red, marginLeft: 2 }}>
                                  {"*"}
                                </Text>
                                :
                                null
                            }
                          </View>


                          <View>



                            {field.formFieldTypeName === 'textfield' && (
                              <TextInput
                                key={field.emrFormFieldId}
                                style={{
                                  width: '100%',
                                  color: Colors.black,
                                  alignItems: "flex-end",
                                  marginTop: 10,
                                  textAlign:
                                    this.state.localLang == 'ar' ? 'right' : 'left',

                                  fontWeight: 'normal',
                                  fontFamily: Fonts.rubikRegular,
                                  borderColor: Colors.grey_3,
                                  borderWidth: 2,
                                  borderRadius: 4,
                                }}
                                placeholder={field.fieldName}
                                placeholderTextColor="#BDBDBD"
                                value={field.fieldValue}
                                onChangeText={text => this.changeTextfeilds(field.fieldName, text)}
                              />
                            )}
                            {field.formFieldTypeName === 'textarea' && (
                              <TextInput
                                style={{
                                  height: 100,
                                  color: "black",
                                  backgroundColor: "white",
                                  marginTop: 10,
                                  borderWidth: 2,
                                  borderRadius: 5,
                                  borderColor: Colors.grey_3,
                                  textAlign:
                                    this.state.localLang == 'ar' ? 'right' : 'left',
                                }}
                                multiline={true}
                                numberOfLines={4}
                                placeholderTextColor="#BDBDBD"
                                placeholder={field.fieldName}
                                value={field.fieldValue}
                                onChangeText={text => this.changeTextfeilds(field.fieldName, text)}
                              />

                            )}
                            {field.formFieldTypeName === 'numberfield' && (
                              <View
                                key={field.emrFormFieldId}
                                style={{

                                }}
                              >
                                {field.numberfieldmodel.fraction === 0 ? (


                                  <TextInput
                                    style={[styles.input, {
                                      textAlign:
                                        this.state.localLang == 'ar' ? 'right' : 'left',
                                    }]}
                                    placeholder={field.fieldName}
                                    keyboardType='numeric'
                                    placeholderTextColor="#BDBDBD"
                                    value={field.fieldValue}
                                    onChangeText={text => this.changeTextfeilds(field.fieldName, text)}
                                    onBlur={() => {
                                      let parsedValue = parseFloat(field.fieldValue);
                                      if (!isNaN(parsedValue)) {
                                        let roundedValue = parsedValue.toFixed(field.numberfieldmodel.decimalno);
                                        this.changeTextfeilds(field.fieldName, roundedValue);
                                      }
                                    }}
                                  />
                                ) : (
                                  <View style={{

                                    flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",
                                    alignItems: 'center'
                                  }}>
                                    <TextInput
                                      style={[styles.input, {
                                        width: '20%',
                                        textAlign:
                                          this.state.localLang == 'ar' ? 'right' : 'left',
                                      }]}
                                      placeholder={field.fieldName}
                                      keyboardType='numeric'
                                      placeholderTextColor="#BDBDBD"
                                      value={field.fieldValue ? field.fieldValue.split('/')[0] : ''}
                                      onChangeText={text => {
                                        const newValue = `${text}${field.numberfieldmodel.fractiondelimiter}${field.fieldValue ? field.fieldValue.split('/')[1] : ''}`;
                                        this.changeTextfeilds(field.fieldName, newValue);
                                      }}
                                    />
                                    <Text style={{ marginHorizontal: 5 }}>{field.numberfieldmodel.fractiondelimiter}</Text>
                                    <TextInput
                                      style={[styles.input, {
                                        width: '20%',
                                        textAlign:
                                          this.state.localLang == 'ar' ? 'right' : 'left',
                                      }]}
                                      placeholder={field.fieldName}
                                      keyboardType='numeric'
                                      placeholderTextColor="#BDBDBD"
                                      value={field.fieldValue ? field.fieldValue.split('/')[1] : ''}
                                      onChangeText={text => {
                                        const newValue = `${field.fieldValue ? field.fieldValue.split('/')[0] : ''}${field.numberfieldmodel.fractiondelimiter}${text}`;
                                        this.changeTextfeilds(field.fieldName, newValue);
                                      }}
                                    />
                                  </View>

                                )}
                              </View>
                            )}

                            {field.formFieldTypeName === 'checkbox' && field.values && (
                              <ScrollView
                              // horizontal={false} 
                              // showsVerticalScrollIndicator={false} 
                              >
                                <View style={{
                                  flexDirection: 'row',
                                  flexWrap: 'wrap',
                                  marginHorizontal: 10,
                                }}>
                                  {field.values.map(checkbox => (
                                    <View
                                      style={{
                                        flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",

                                        alignItems: 'center',

                                        marginRight: 5,
                                        marginLeft: 5,
                                        width: '45%',
                                      }}
                                      key={checkbox.id}
                                    >
                                      <CheckBox
                                        style={{ marginTop: 10 }}
                                        isChecked={checkbox.isSelected || false}
                                        onClick={() => this.handleChange(field.fieldName, checkbox.id)}
                                        checkedCheckBoxColor={Colors.primaryColor}
                                        uncheckedCheckBoxColor="#BDBDBD"
                                      />
                                      <Text style={{
                                        marginTop: 10,
                                        marginLeft: 5,
                                        marginRight: 15,
                                        alignSelf: "auto"

                                      }}>{checkbox.value}</Text>
                                    </View>
                                  ))}
                                </View>
                              </ScrollView>
                            )}

                            {field.formFieldTypeName === 'radiobutton' && field.values && (
                              <View style={{
                                flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",


                                marginLeft: 15, marginRight: 20
                              }}>
                                {field.values.map((radio, index) => (
                                  <View style={{
                                    flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",

                                  }} key={index}>
                                    <RadioButton
                                      innerColor={Colors.secondaryColor}
                                      outerColor={Colors.secondaryColor}
                                      isSelected={radio.isSelected} // Set isSelected based on the radio button's isSelected property
                                      size={10}
                                      animation={'bounceIn'}
                                      onPress={() => this.handleChangeRadio(field.emrFormFieldId, radio.id)} // Pass field name instead of radio value
                                    />
                                    <View>
                                      <Text style={{ margin: 9 }}>{radio.value}</Text>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}

                            {field.formFieldTypeName === 'dropdown' && (
                              <DropDownPicker
                                items={field.values.map(option => ({ label: option.value, value: option.value }))}
                                labelStyle={{
                                  textAlign:
                                    this.state.localLang == 'ar' ? 'right' : 'left',
                                  transform:
                                    this.state.localLang == 'ar'
                                      ? [{ rotateY: '180deg' }]
                                      : [{ rotateY: '0deg' }],
                                }}
                                itemStyle={{
                                  justifyContent:
                                    this.state.localLang == 'ar'
                                      ? 'flex-start'
                                      : 'flex-start',
                                  fontFamily: Fonts.rubikRegular,
                                }}

                                controller={(instance) => (this.controller = instance)}
                                arrowStyle={{
                                  marginRight: 10,
                                }}
                                showArrow="true"
                                arrowColor={Colors.secondaryColor}
                                defaultValue={field.values.find(option => option.isSelected)?.value || null}
                                containerStyle={{
                                  marginBottom: 10,
                                  marginTop: 20,
                                  marginBottom: 3,
                                  height: 50,
                                }}
                                placeholder={field.fieldName}
                                placeholderTextColor={Colors.grey_3}
                                placeholderStyle={{ fontSize: 14, color: Colors.grey_5, fontFamily: Fonts.rubikRegular, }}
                                style={{

                                  backgroundColor: '#fff',
                                  transform:
                                    this.state.localLang == 'ar'
                                      ? [{ rotateY: '180deg' }]
                                      : [{ rotateY: '0deg' }],
                                }}
                                dropDownStyle={{
                                  backgroundColor: '#fff',
                                  fontFamily: Fonts.rubikRegular,
                                  transform:
                                    this.state.localLang == 'ar'
                                      ? [{ rotateY: '180deg' }]
                                      : [{ rotateY: '0deg' }],
                                }}
                                onChangeItem={(item) => this.handleChangedropdown(field.fieldName, item.value)}
                              />
                            )}



                            {
                              field.formFieldTypeName === 'fileupload' && (

                                <View key={field.emrFormFieldId}>
                                  {field.files.length < field.fileCount && (
                                    <TouchableOpacity
                                      onPress={() => {
                                        this.selectDoc(field.emrFormFieldId)

                                      }}
                                    >
                                      <View style={{
                                        backgroundColor: Colors.secondaryColor, paddingBottom: 6, paddingRight: 10, paddingLeft: 10,
                                        paddingTop: 6, borderRadius: 4,
                                        marginRight: 6,
                                        alignSelf: this.state.localLang == 'en' ? 'flex-end' : 'flex-start',
                                        flexDirection: 'row',
                                        marginTop: 10
                                      }}>
                                        <Feather style={{ alignSelf: 'center', fontFamily: Fonts.rubikRegular }} name="plus" size={13} color={Colors.white} />
                                        <Text style={{ marginLeft: 8, color: Colors.white, fontFamily: Fonts.rubikRegular, fontSize: 11 }}>
                                          {translate('add')}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  )}
                                  <View>

                                    {field.files
                                      .length !== 0 ? (
                                      <>
                                        {field.files.map((item, itemIndex) => (
                                          <View key={item.id}>
                                            <View style={{
                                              marginTop: 20,
                                              flexDirection: 'column',
                                              marginLeft: 5,
                                              marginRight: 5,
                                              marginBottom: 5,
                                              paddingBottom: 5,
                                              height: 'auto',
                                              maxHeight: 200,
                                              backgroundColor: Colors.white,
                                            }}>
                                              <View
                                                style={{
                                                  marginTop: 5,
                                                  marginBottom: 2,
                                                  // marginLeft: 4,
                                                  // marginRight: 3,
                                                  borderRadius: 4,
                                                  borderWidth: 3,
                                                  borderColor: Colors.grey_3,
                                                  flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",

                                                  backgroundColor: Colors.white,
                                                  padding: 8,
                                                }}>
                                                <View
                                                  style={{
                                                    flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",

                                                    alignItems: 'center',
                                                    flex: 10,
                                                  }}>
                                                  <Image
                                                    source={require('../images/filesf.png')}
                                                    style={{
                                                      paddingLeft: 5,
                                                      paddingRight: 8,
                                                      marginRight: 4,
                                                      alignSelf: 'center',
                                                      alignItems: 'center',
                                                      height: 20,
                                                      width: 18,
                                                    }}
                                                  />
                                                  <View style={{ flexDirection: 'column', flex: 10 }}>
                                                    <View style={{
                                                      flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",

                                                    }}>
                                                      <View
                                                        style={{
                                                          flex: 7,
                                                          alignSelf: 'center',
                                                          flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",

                                                        }}>
                                                        <TouchableOpacity

                                                        >

                                                          <Text>{item.displayName}</Text>
                                                        </TouchableOpacity>
                                                      </View>

                                                      {item.appntemrformfieldFileMapId!=undefined?

                                                      <TouchableOpacity
                                                        style={{
                                                          justifyContent: 'center',
                                                        }}
                                                        onPress={() => {
                                                          this.downloadEMR(
                                                            item.appntemrformfieldFileMapId
                                                          );
                                                        }
                                                        }
                                                      >
                                                        <View
                                                          style={{
                                                            width: 30,
                                                            height: 30,
                                                            marginRight: 4,
                                                            marginLeft: 4,
                                                            marginTop: 2,
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            elevation: 3,
                                                          }}>
                                                          <Feather name="download" size={20} color={Colors.secondaryColor} />
                                                        </View>
                                                      </TouchableOpacity>:
                                                      null}


                                                      <TouchableOpacity
                                                        style={{
                                                          justifyContent: 'center',
                                                        }}
                                                        onPress={() => {

                                                          this._deleteEmr(item.appntemrformfieldFileMapId,
                                                             field.emrFormFieldId, itemIndex)

                                                          // this.deleteDoc(field.emrFormFieldId, itemIndex);
                                                        }}
                                                      >
                                                        <View
                                                          style={{
                                                            width: 30,
                                                            height: 30,
                                                            marginRight: 4,
                                                            marginLeft: 4,
                                                            marginTop: 2,
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            elevation: 3,
                                                          }}>
                                                          <Feather name="x" size={20} color={Colors.red} />
                                                        </View>
                                                      </TouchableOpacity>


                                                    </View>
                                                  </View>
                                                </View>
                                              </View>
                                            </View>
                                          </View>
                                        ))}
                                      </>
                                    ) : null}

                                    {field.files
                                      .length !== 0 ? (
                                      <>
                                        <Text
                                          allowFontScaling={false}
                                          style={{
                                            paddingLeft: 5,
                                            paddingRight: 5,
                                            paddingTop: 3,
                                            marginRight:
                                              this.state.localLang == 'ar' ? 15 : 0,
                                            color: Colors.lightRed1,
                                            fontSize: 12,
                                            fontFamily: Fonts.rubikRegular,
                                          }}>
                                          {translate('notefilesize')}{field.maxFileSize}{" MB."}
                                        </Text>


                                        <View
                                          style={{
                                            flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",
                                            // marginRight: 5,
                                            // marginLeft: 5
                                            // paddingLeft:5,
                                            paddingRight: 5
                                          }}
                                        >
                                          <Text

                                            allowFontScaling={false}
                                            style={{
                                              paddingLeft: 5,
                                              paddingRight: 5,
                                              paddingTop: 3,

                                              color: Colors.lightRed1,
                                              fontSize: 12,
                                              fontFamily: Fonts.rubikRegular,
                                            }}>
                                            {translate("supportedfiles")}
                                          </Text>


                                          {
                                            field.fileTypes.map((data, id) => (
                                              <View
                                                style={{
                                                  flexDirection: this.state.localLang == "en" ? 'row' : "row-reverse",

                                                }}
                                                key={id}
                                              >
                                                <View style={{
                                                  flexDirection: "row"
                                                }}>
                                                  <Text

                                                    allowFontScaling={false}
                                                    style={{
                                                      paddingTop: 3,
                                                      color: Colors.lightRed1,
                                                      fontSize: 12,
                                                      fontFamily: Fonts.rubikRegular,
                                                    }}>
                                                    {data.displayName}
                                                    {this.state.localLang === 'ar'
                                                      ? id !== 0
                                                        ? ','
                                                        : ''
                                                      : id !== field.fileTypes.length - 1
                                                        ? ','
                                                        : ''}
                                                  </Text>
                                                </View>

                                              </View>

                                            ))
                                          }
                                        </View>

                                        {/* {field.files.length < field.fileCount && ( */}
                                        <TouchableOpacity
                                          onPress={() => {
                                            this.fileUpload(
                                              field.emrFormFieldId,
                                              field.emrformfieldEmrgroupMapId,
                                              field.appntEmrMapformfieldFileMapId > 0 ? field.appntEmrMapformfieldFileMapId : undefined,
                                              field.appntEmrMapId
                                            )
                                          }


                                          }

                                        >
                                          <View style={{
                                            backgroundColor: Colors.forestgreen, paddingBottom: 6, paddingRight: 10, paddingLeft: 10, paddingTop: 6, borderRadius: 4, marginRight: 6,
                                            alignSelf: this.state.localLang == 'ar' ? 'flex-end' : 'flex-start',

                                            flexDirection: 'row',
                                            marginTop: 15
                                          }}>
                                            <Feather style={{ alignSelf: 'center', fontFamily: Fonts.rubikRegular }} name="upload" size={13} color={Colors.white} />
                                            <Text style={{ marginLeft: 8, color: Colors.white, fontFamily: Fonts.rubikRegular, fontSize: 11 }}>
                                              {translate('upload')}
                                            </Text>
                                          </View>
                                        </TouchableOpacity>
                                        {/* // )} */}
                                      </>
                                    ) : null}
                                  </View>
                                </View>
                              )
                            }


                          </View>


                          <View>

                          </View>








                        </View>

                      ))}


                      <View>



                      </View>

                    </View>
                  </View>





                </View>

              ))}
              {this.state.emrformPressed && (
                <TouchableOpacity
                  style={{
                    marginRight: 20,
                    marginLeft: 20

                  }}
                  onPress={this.submitEmrForm}>
                  <View
                    style={{
                      backgroundColor: Colors.primaryColor,
                      padding: 10,
                      borderRadius: 4,
                      alignSelf: this.state.localLang == 'en' ? 'flex-end' : 'flex-start',

                      marginBottom: 20,
                      borderRadius: 5,
                      flexDirection:
                        this.state.localLang == 'ar'
                          ? 'row-reverse'
                          : 'row',
                    }}>
                    <Text
                      style={{
                        color: Colors.white,
                        fontFamily: Fonts.rubikRegular,
                        fontSize: 12,
                      }}>
                      {translate('submit')}
                    </Text>
                  </View>
                </TouchableOpacity>

              )}


              {this.state.updateVisible && (


                <TouchableOpacity
                  style={{ marginRight: 20, marginLeft: 20 }}
                  onPress={this.updateEmrForm}>
                  <View
                    style={{
                      backgroundColor: Colors.primaryColor,
                      padding: 10,
                      borderRadius: 4,
                      alignSelf: this.state.localLang == 'en' ? 'flex-end' : 'flex-start',

                      marginBottom: 20,
                      borderRadius: 5,
                      flexDirection:
                        this.state.localLang == 'ar'
                          ? 'row-reverse'
                          : 'row',
                    }}>
                    <Text
                      style={{
                        color: Colors.white,
                        fontFamily: Fonts.rubikRegular,
                        fontSize: 12,
                      }}>
                      {translate('update')}
                    </Text>
                  </View>
                </TouchableOpacity>

              )}


            </ScrollView>

        }
        <Toast
          ref="toasterror"
          style={{
            backgroundColor: Colors.red,
            fontFamily: Fonts.rubikRegular,
            fontSize: 10,
          }}
          position="bottom"
          fadeInDuration={750}
          fadeOutDuration={1000}
          opacity={1}
          textStyle={{
            color: Colors.white,
            fontFamily: Fonts.rubikRegular,
            fontSize: 10,
          }}
        />

        <Toast
          ref="toastsuccess"
          style={{
            backgroundColor: Colors.greenColor,
            fontFamily: Fonts.rubikRegular,
            fontSize: 10,
          }}
          position="bottom"
          fadeInDuration={750}
          fadeOutDuration={1000}
          opacity={1}
          textStyle={{
            color: Colors.white,
            fontFamily: Fonts.rubikRegular,
            fontSize: 10,
          }}
        />

        <Modal
          supportedOrientations={['portrait', 'landscape']}
          // animationType="fade"
          transparent={true}
          visible={this.state.isLoading}
          onRequestClose={() => {
            this.setState({ isLoading: false });
          }}>
          <View
            style={{
              flex: 1,
              position: 'absolute',
              backgroundColor: Colors.progressTransBackground,
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}>
            <View
              style={{
                alignSelf: 'center',
                justifyContent: 'center',
                height: '15%',
                width: '30%',
                backgroundColor: Colors.dialogBackground,
                borderRadius: 10,
                marginBottom: 40,
              }}>
              <View style={{}}>
                <ActivityIndicator
                  size="large"
                  color={Colors.secondaryColor}
                />
              </View>
            </View>
          </View>
        </Modal>

      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    // Your header container styles
  },
  input: {
    marginTop: 10,
    padding: 10,
    borderColor: Colors.grey_3,
    borderWidth: 2,
    borderRadius: 4,
  },
  emptyListStyle: {
    flex: 1,
    padding: 10,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    height: 85,
    width: window.width,
    backgroundColor: Colors.primaryColor,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingModelcenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModelviewBackground: {
    flex: 1,
    position: 'absolute',
    backgroundColor: '#00000055',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  loadingModelview: {
    alignSelf: 'center',
    justifyContent: 'center',
    height: '15%',
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    marginBottom: 40,
  },
  appoitmentChoose: {
    // marginLeft: 20, 
    // marginRight: 20, 
    marginTop: 5
  },
  appointmentChooseFile: {
    justifyContent: "center",
    backgroundColor: Colors.primaryColor,
    marginTop: 10,

  },
  appointmentChooseTxt:
  {
    marginLeft: 10,
    marginRight: 10,
    color: Colors.white,
    fontFamily: Fonts.rubikRegular,
    fontSize: 12
  },
  documentView: {
    marginTop: 10,
    borderColor: Colors.grey_3,
    borderWidth: 1,

  },
  selectFile: {
    margin: 10,
    color: Colors.grey_1,
    fontFamily: Fonts.rubikRegular,
    fontSize: 11
  },
  pickedDoc: {
    marginTop: 5,
    color: Colors.red,
    fontFamily: Fonts.rubikRegular,
    fontSize: 12,
  }, addButton: {
    backgroundColor: Colors.secondaryColor,
    paddingBottom: 6,
    paddingRight: 10,
    paddingLeft: 10,
    paddingTop: 6,
    borderRadius: 4,
    marginRight: 6,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    marginTop: 10,
  },
  uploadContainer: {
    marginTop: 20,
    flexDirection: 'column',
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 5,
    paddingBottom: 5,
    height: 'auto',
    maxHeight: 200,
    backgroundColor: Colors.white,
  },
  fileContainer: {
    marginTop: 5,
    marginBottom: 2,
    marginLeft: 4,
    marginRight: 3,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: Colors.grey_3,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 8,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 10,
  },
  fileIcon: {
    paddingLeft: 5,
    paddingRight: 8,
    marginRight: 4,
    alignSelf: 'center',
    alignItems: 'center',
    height: 20,
    width: 18,
  },
  fileTextContainer: {
    flexDirection: 'column',
    flex: 10,
  },
  deleteButton: {
    justifyContent: 'center',
  },
  deleteIconContainer: {
    width: 30,
    height: 30,
    marginRight: 4,
    marginLeft: 4,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  uploadButton: {
    backgroundColor: Colors.forestgreen,
    paddingBottom: 6,
    paddingRight: 10,
    paddingLeft: 10,
    paddingTop: 6,
    borderRadius: 4,
    marginRight: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    marginTop: 20,
  },
  icon: {
    alignSelf: 'center',
    fontFamily: Fonts.rubikRegular,
  },
  buttonText: {
    marginLeft: 8,
    color: Colors.white,
    fontFamily: Fonts.rubikRegular,
    fontSize: 11,
  },
});

export default EMR;
